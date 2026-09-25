import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, eq, gt } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { memberDirectory } from "../data/member-directory";
import { QUIZ_QUESTION_COUNT, quizRepository } from "../data/quiz-repository";
import { getDb } from "../db/client";
import {
	members,
	REGISTRATION_STAGES,
	type Registration,
	type RegistrationStage,
	registrations,
} from "../db/schema";
import { issueTokens } from "../lib/auth";
import { hashPassword, randomToken, secureShuffle, sha256Hex } from "../lib/crypto";
import { sendVerificationEmail } from "../lib/mail";
import { MEMBER_CODE_PATTERN, normalizeMemberCode } from "../lib/member-code";
import { clientIp, withinRateLimit } from "../lib/rate-limit";
import {
	errorResponse,
	jsonBody,
	jsonResponse,
	PasswordSchema,
	registrationSecurity,
	TokenPairSchema,
} from "./common";

/** 登録チケットの有効期間 */
const TICKET_TTL_MS = 60 * 60 * 1000;
/** 1 つの認証コードで 24 時間以内に開始できる登録の数 */
const MAX_REGISTRATIONS_PER_CODE_PER_DAY = 5;
/** 1 回の登録で間違えられるクイズの回数 */
const MAX_QUIZ_FAILURES = 3;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_EMAIL_SENDS = 5;

export const REGISTRATION_TICKET_HEADER = "X-Registration-Ticket";

const INVALID_CODE_MESSAGE = "認証コードが正しくありません。";
const INVALID_LINK_MESSAGE = "リンクが無効か、有効期限が切れています。";

// ---- スキーマ ----

const MemberSummarySchema = z
	.object({ name: z.string(), graduationYear: z.int() })
	.openapi("MemberSummary");

const RegistrationSchema = z
	.object({
		stage: z.enum(REGISTRATION_STAGES),
		member: MemberSummarySchema,
		email: z.string().nullable(),
		quizRemainingAttempts: z.int(),
	})
	.openapi("Registration");

const StageConflictSchema = z
	.object({ message: z.string(), stage: z.enum(REGISTRATION_STAGES) })
	.openapi("StageConflict");

const stageConflict = {
	description: "登録の段階が合わない。`stage` の画面へ移動する",
	content: { "application/json": { schema: StageConflictSchema } },
};

const QuizQuestionSchema = z
	.object({
		id: z.string(),
		text: z.string(),
		image: z.string().optional(),
		type: z.enum(["single", "multiple"]),
		choices: z.array(z.object({ id: z.string(), text: z.string() })),
	})
	.openapi("QuizQuestion");

// ---- ルート定義 ----

const startRoute = createRoute({
	method: "post",
	path: "/v1/registrations",
	request: jsonBody(z.object({ code: z.string().max(64) })),
	responses: {
		201: jsonResponse(
			"登録を開始した。以降は `ticket` を X-Registration-Ticket ヘッダーで送る",
			z.object({ ticket: z.string(), registration: RegistrationSchema }),
		),
		404: errorResponse("認証コードが存在しない（形式が不正な場合も同じ）"),
		409: errorResponse("この認証コードは登録済み"),
		429: errorResponse("試行回数が多すぎる"),
	},
});

const currentRoute = createRoute({
	method: "get",
	path: "/v1/registrations/current",
	security: registrationSecurity,
	responses: {
		200: jsonResponse("登録の現在の状態", RegistrationSchema),
		401: errorResponse("登録チケットが無効または期限切れ"),
		404: errorResponse("認証コードの会員が見つからない"),
	},
});

const confirmRoute = createRoute({
	method: "post",
	path: "/v1/registrations/current/confirm",
	security: registrationSecurity,
	responses: {
		200: jsonResponse("本人確認を済ませた", RegistrationSchema),
		401: errorResponse("登録チケットが無効または期限切れ"),
		404: errorResponse("認証コードの会員が見つからない"),
		409: stageConflict,
	},
});

const getQuizRoute = createRoute({
	method: "get",
	path: "/v1/registrations/current/quiz",
	security: registrationSecurity,
	responses: {
		200: jsonResponse(
			"出題する問題（正解は含まない）",
			z.object({ questions: z.array(QuizQuestionSchema), remainingAttempts: z.int() }),
		),
		401: errorResponse("登録チケットが無効または期限切れ"),
		403: errorResponse("挑戦できる回数を使い切った"),
		409: stageConflict,
	},
});

const answerQuizRoute = createRoute({
	method: "post",
	path: "/v1/registrations/current/quiz",
	security: registrationSecurity,
	request: jsonBody(
		z.object({
			answers: z
				.record(z.string(), z.array(z.string()))
				.openapi({ description: "問題 ID → 選んだ選択肢 ID の配列" }),
		}),
	),
	responses: {
		200: jsonResponse(
			"採点結果。どの問題を間違えたかは返さない",
			z.object({ passed: z.boolean(), remainingAttempts: z.int() }),
		),
		401: errorResponse("登録チケットが無効または期限切れ"),
		403: errorResponse("挑戦できる回数を使い切った"),
		409: stageConflict,
	},
});

const emailRoute = createRoute({
	method: "post",
	path: "/v1/registrations/current/email",
	security: registrationSecurity,
	request: jsonBody(z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) })),
	responses: {
		202: jsonResponse("確認メールを送った", RegistrationSchema),
		401: errorResponse("登録チケットが無効または期限切れ"),
		404: errorResponse("認証コードの会員が見つからない"),
		409: {
			description: "登録の段階が合わない（`stage` あり）、またはメールアドレスが登録済み",
			content: {
				"application/json": {
					schema: z.object({
						message: z.string(),
						stage: z.enum(REGISTRATION_STAGES).optional(),
					}),
				},
			},
		},
		429: errorResponse("再送信の間隔が短い、または回数の上限に達した"),
	},
});

const getVerificationRoute = createRoute({
	method: "get",
	path: "/v1/registrations/verification",
	request: { query: z.object({ token: z.string() }) },
	responses: {
		200: jsonResponse(
			"確認メールのリンクが有効",
			z.object({ email: z.string(), member: MemberSummarySchema }),
		),
		404: errorResponse("リンクが無効または期限切れ"),
	},
});

const completeRoute = createRoute({
	method: "post",
	path: "/v1/registrations/verification",
	request: jsonBody(z.object({ token: z.string(), password: PasswordSchema })),
	responses: {
		201: jsonResponse("登録を完了し、ログインした", TokenPairSchema),
		404: errorResponse("リンクが無効または期限切れ"),
		409: errorResponse("メールアドレスまたは認証コードが登録済み"),
	},
});

// ---- 処理 ----

type RegistrationEnv = {
	// biome-ignore lint/style/useNamingConvention: Hono の Env 型のキー
	Variables: { registration: Registration };
};

/** X-Registration-Ticket ヘッダーの登録チケットから、進行中の登録を取り出す */
const requireRegistration = createMiddleware<RegistrationEnv>(async (c, next) => {
	const ticket = c.req.header(REGISTRATION_TICKET_HEADER);
	const registration = ticket
		? await getDb().query.registrations.findFirst({
				where: and(
					eq(registrations.ticketHash, await sha256Hex(ticket)),
					gt(registrations.expiresAt, new Date()),
				),
			})
		: undefined;
	if (!registration || registration.stage === "completed") {
		return c.json({ message: "登録の有効期限が切れました。最初からやり直してください。" }, 401);
	}
	c.set("registration", registration);
	await next();
});

function remainingAttempts(registration: Registration): number {
	return Math.max(0, MAX_QUIZ_FAILURES - registration.quizFailures);
}

async function toRegistrationResponse(registration: Registration) {
	const entry = await memberDirectory.findByCode(registration.memberCode);
	if (!entry) {
		return null;
	}
	return {
		stage: registration.stage,
		member: { name: entry.name, graduationYear: entry.graduationYear },
		email: registration.email,
		quizRemainingAttempts: remainingAttempts(registration),
	};
}

function hasStage(registration: Registration, allowed: RegistrationStage[]): boolean {
	return allowed.includes(registration.stage);
}

function stageConflictBody(registration: Registration) {
	return { message: "この操作は現在の登録段階では行えません。", stage: registration.stage };
}

async function updateRegistration(id: string, values: Partial<Registration>) {
	const [updated] = await getDb()
		.update(registrations)
		.set(values)
		.where(eq(registrations.id, id))
		.returning();
	if (!updated) {
		throw new Error(`registration not found: ${id}`);
	}
	return updated;
}

async function findByEmailToken(token: string) {
	return await getDb().query.registrations.findFirst({
		where: and(
			eq(registrations.emailTokenHash, await sha256Hex(token)),
			eq(registrations.stage, "email_sent"),
			gt(registrations.emailTokenExpiresAt, new Date()),
		),
	});
}

const notFoundMember = { message: "会員情報が見つかりません。" };

const app = new OpenAPIHono<RegistrationEnv>();
app.use("/v1/registrations/current", requireRegistration);
app.use("/v1/registrations/current/*", requireRegistration);

export const registrationsApp = app
	.openapi(startRoute, async c => {
		if (!(await withinRateLimit(env.CODE_RATE_LIMITER, clientIp(c)))) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const code = normalizeMemberCode(c.req.valid("json").code);
		const entry = MEMBER_CODE_PATTERN.test(code) ? await memberDirectory.findByCode(code) : null;
		if (!entry) {
			return c.json({ message: INVALID_CODE_MESSAGE }, 404);
		}

		const db = getDb();
		if (await db.query.members.findFirst({ where: eq(members.memberCode, code) })) {
			return c.json({ message: "この認証コードは登録済みです。ログインしてください。" }, 409);
		}
		const [recent] = await db
			.select({ value: count() })
			.from(registrations)
			.where(
				and(
					eq(registrations.memberCode, code),
					gt(registrations.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)),
				),
			);
		if ((recent?.value ?? 0) >= MAX_REGISTRATIONS_PER_CODE_PER_DAY) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}

		const ticket = randomToken();
		const [registration] = await db
			.insert(registrations)
			.values({
				ticketHash: await sha256Hex(ticket),
				memberCode: code,
				stage: "code_verified",
				expiresAt: new Date(Date.now() + TICKET_TTL_MS),
			})
			.returning();
		if (!registration) {
			throw new Error("failed to create registration");
		}
		return c.json(
			{
				ticket,
				registration: {
					stage: registration.stage,
					member: { name: entry.name, graduationYear: entry.graduationYear },
					email: null,
					quizRemainingAttempts: remainingAttempts(registration),
				},
			},
			201,
		);
	})
	.openapi(currentRoute, async c => {
		const body = await toRegistrationResponse(c.var.registration);
		return body ? c.json(body, 200) : c.json(notFoundMember, 404);
	})
	.openapi(confirmRoute, async c => {
		let registration = c.var.registration;
		if (!hasStage(registration, ["code_verified", "confirmed"])) {
			return c.json(stageConflictBody(registration), 409);
		}
		registration = await updateRegistration(registration.id, { stage: "confirmed" });
		const body = await toRegistrationResponse(registration);
		return body ? c.json(body, 200) : c.json(notFoundMember, 404);
	})
	.openapi(getQuizRoute, async c => {
		let registration = c.var.registration;
		if (!hasStage(registration, ["confirmed"])) {
			return c.json(stageConflictBody(registration), 409);
		}
		if (remainingAttempts(registration) === 0) {
			return c.json({ message: "挑戦できる回数の上限に達しました。" }, 403);
		}
		const pool = await quizRepository.list();
		// 出題は挑戦ごとに固定し、読み直しで問題を選び直せないようにする
		if (!registration.quizQuestionIds) {
			registration = await updateRegistration(registration.id, {
				quizQuestionIds: secureShuffle(pool)
					.slice(0, QUIZ_QUESTION_COUNT)
					.map(question => question.id),
			});
		}
		const ids = registration.quizQuestionIds ?? [];
		const questions = ids
			.map(id => pool.find(question => question.id === id))
			.filter(question => question !== undefined)
			.map(({ answers: _answers, ...question }) => question);
		return c.json({ questions, remainingAttempts: remainingAttempts(registration) }, 200);
	})
	.openapi(answerQuizRoute, async c => {
		const registration = c.var.registration;
		if (!hasStage(registration, ["confirmed"]) || !registration.quizQuestionIds) {
			return c.json(stageConflictBody(registration), 409);
		}
		if (remainingAttempts(registration) === 0) {
			return c.json({ message: "挑戦できる回数の上限に達しました。" }, 403);
		}
		const { answers } = c.req.valid("json");
		const pool = await quizRepository.list();
		const passed = registration.quizQuestionIds.every(id => {
			const expected = pool.find(question => question.id === id)?.answers;
			const given = new Set(answers[id] ?? []);
			return (
				expected !== undefined &&
				expected.length === given.size &&
				expected.every(answer => given.has(answer))
			);
		});
		const updated = await updateRegistration(
			registration.id,
			passed
				? { stage: "quiz_passed" }
				: // 不正解なら次の挑戦では別の問題を出す
					{ quizFailures: registration.quizFailures + 1, quizQuestionIds: null },
		);
		return c.json({ passed, remainingAttempts: remainingAttempts(updated) }, 200);
	})
	.openapi(emailRoute, async c => {
		const registration = c.var.registration;
		if (!hasStage(registration, ["quiz_passed", "email_sent"])) {
			return c.json(stageConflictBody(registration), 409);
		}
		const { email } = c.req.valid("json");
		if (await getDb().query.members.findFirst({ where: eq(members.email, email) })) {
			return c.json({ message: "このメールアドレスは既に登録されています。" }, 409);
		}
		const sentAt = registration.emailSentAt?.getTime() ?? 0;
		if (
			Date.now() - sentAt < EMAIL_RESEND_COOLDOWN_MS ||
			registration.emailSendCount >= MAX_EMAIL_SENDS
		) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const entry = await memberDirectory.findByCode(registration.memberCode);
		if (!entry) {
			return c.json(notFoundMember, 404);
		}

		const token = randomToken();
		const updated = await updateRegistration(registration.id, {
			stage: "email_sent",
			email,
			emailTokenHash: await sha256Hex(token),
			emailTokenExpiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
			emailSentAt: new Date(),
			emailSendCount: registration.emailSendCount + 1,
			// メールのリンクを開くまで登録チケットも有効にしておく
			expiresAt: new Date(Date.now() + EMAIL_TOKEN_TTL_MS),
		});
		const verifyUrl = new URL("/register/verify", env.SITE_URL);
		verifyUrl.searchParams.set("token", token);
		await sendVerificationEmail({ to: email, name: entry.name, verifyUrl: verifyUrl.toString() });

		const body = await toRegistrationResponse(updated);
		return body ? c.json(body, 202) : c.json(notFoundMember, 404);
	})
	.openapi(getVerificationRoute, async c => {
		const registration = await findByEmailToken(c.req.valid("query").token);
		const entry = registration ? await memberDirectory.findByCode(registration.memberCode) : null;
		if (!registration?.email || !entry) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		return c.json(
			{
				email: registration.email,
				member: { name: entry.name, graduationYear: entry.graduationYear },
			},
			200,
		);
	})
	.openapi(completeRoute, async c => {
		const { token, password } = c.req.valid("json");
		const registration = await findByEmailToken(token);
		const entry = registration ? await memberDirectory.findByCode(registration.memberCode) : null;
		if (!registration?.email || !entry) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}

		const db = getDb();
		const memberId = crypto.randomUUID();
		try {
			await db.batch([
				db.insert(members).values({
					id: memberId,
					memberCode: registration.memberCode,
					email: registration.email,
					passwordHash: await hashPassword(password),
					name: entry.name,
					graduationYear: entry.graduationYear,
				}),
				db
					.update(registrations)
					.set({ stage: "completed", emailTokenHash: null, quizQuestionIds: null })
					.where(eq(registrations.id, registration.id)),
			]);
		} catch (error) {
			// 同じ認証コードやメールアドレスで先に登録が完了していた場合（UNIQUE 制約違反）
			if (String(error).includes("UNIQUE")) {
				return c.json(
					{ message: "このメールアドレスまたは認証コードは既に登録されています。" },
					409,
				);
			}
			throw error;
		}
		return c.json(await issueTokens(memberId), 201);
	});
