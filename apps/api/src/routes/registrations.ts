import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, count, eq, gt, lt, sql } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { getDb } from "../db/client";
import {
	members,
	REGISTRATION_STAGES,
	type Registration,
	type RegistrationStage,
	type RosterEntry,
	registrations,
	roster,
} from "../db/schema";
import { issueTokens } from "../lib/auth";
import { hashPassword, randomToken, sha256Hex } from "../lib/crypto";
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
/** 1 回の登録で卒業年を間違えられる回数 */
const MAX_YEAR_FAILURES = 3;
const EMAIL_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_EMAIL_SENDS = 5;

export const REGISTRATION_TICKET_HEADER = "X-Registration-Ticket";

const INVALID_CODE_MESSAGE = "認証コードが正しくありません。";
const INVALID_LINK_MESSAGE = "リンクが無効か、有効期限が切れています。";

// ---- スキーマ ----

const MemberSummarySchema = z
	.object({
		name: z.string(),
		formerName: z.string().nullable(),
		graduationYear: z
			.int()
			.nullable()
			.openapi({ description: "卒業した年（西暦）。中学卒業は null" }),
	})
	.openapi("MemberSummary");

const RegistrationSchema = z
	.object({
		stage: z.enum(REGISTRATION_STAGES),
		member: MemberSummarySchema.nullable().openapi({
			description: "卒業年の照合が済むまでは null（コードだけで個人情報を見られないようにする）",
		}),
		email: z.string().nullable(),
		yearRemainingAttempts: z.int(),
	})
	.openapi("Registration");

const StageConflictSchema = z
	.object({ message: z.string(), stage: z.enum(REGISTRATION_STAGES) })
	.openapi("StageConflict");

const stageConflict = {
	description: "登録の段階が合わない。`stage` の画面へ移動する",
	content: { "application/json": { schema: StageConflictSchema } },
};

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
		404: errorResponse("名簿に会員が見つからない"),
	},
});

const graduationYearRoute = createRoute({
	method: "post",
	path: "/v1/registrations/current/graduation-year",
	security: registrationSecurity,
	request: jsonBody(
		z.object({
			graduationYear: z.int().nullable().openapi({ description: "中学卒業を選んだ場合は null" }),
		}),
	),
	responses: {
		200: jsonResponse("照合結果", z.object({ verified: z.boolean(), remainingAttempts: z.int() })),
		401: errorResponse("登録チケットが無効または期限切れ"),
		403: errorResponse("間違えられる回数を使い切った"),
		404: errorResponse("名簿に会員が見つからない"),
		409: stageConflict,
	},
});

const confirmRoute = createRoute({
	method: "post",
	path: "/v1/registrations/current/confirm",
	security: registrationSecurity,
	responses: {
		200: jsonResponse("本人確認を済ませた", RegistrationSchema),
		401: errorResponse("登録チケットが無効または期限切れ"),
		404: errorResponse("名簿に会員が見つからない"),
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
		404: errorResponse("名簿に会員が見つからない"),
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
		502: errorResponse("確認メールを送れなかった。登録の状態は変えていない"),
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
		409: errorResponse("メールアドレスまたは会員が登録済み"),
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

async function findRoster(memberNo: string) {
	return await getDb().query.roster.findFirst({ where: eq(roster.memberNo, memberNo) });
}

function memberSummary(entry: RosterEntry) {
	return {
		name: entry.name,
		formerName: entry.formerName,
		graduationYear: entry.graduationYear,
	};
}

function remainingAttempts(registration: Registration): number {
	return Math.max(0, MAX_YEAR_FAILURES - registration.yearFailures);
}

function toRegistrationResponse(registration: Registration, entry: RosterEntry) {
	return {
		stage: registration.stage,
		member: registration.stage === "code_verified" ? null : memberSummary(entry),
		email: registration.email,
		yearRemainingAttempts: remainingAttempts(registration),
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
const lockedMessage = { message: "間違えられる回数の上限に達しました。" };

const app = new OpenAPIHono<RegistrationEnv>();
app.use("/v1/registrations/current", requireRegistration);
app.use("/v1/registrations/current/*", requireRegistration);

export const registrationsApp = app
	.openapi(startRoute, async c => {
		if (!(await withinRateLimit(env.CODE_RATE_LIMITER, clientIp(c)))) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const code = normalizeMemberCode(c.req.valid("json").code);
		const db = getDb();
		const entry = MEMBER_CODE_PATTERN.test(code)
			? await db.query.roster.findFirst({ where: eq(roster.codeHash, await sha256Hex(code)) })
			: undefined;
		if (!entry) {
			return c.json({ message: INVALID_CODE_MESSAGE }, 404);
		}

		if (await db.query.members.findFirst({ where: eq(members.memberNo, entry.memberNo) })) {
			return c.json({ message: "この認証コードは登録済みです。ログインしてください。" }, 409);
		}
		const [recent] = await db
			.select({ value: count() })
			.from(registrations)
			.where(
				and(
					eq(registrations.memberNo, entry.memberNo),
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
				memberNo: entry.memberNo,
				stage: "code_verified",
				expiresAt: new Date(Date.now() + TICKET_TTL_MS),
			})
			.returning();
		if (!registration) {
			throw new Error("failed to create registration");
		}
		return c.json({ ticket, registration: toRegistrationResponse(registration, entry) }, 201);
	})
	.openapi(currentRoute, async c => {
		const registration = c.var.registration;
		const entry = await findRoster(registration.memberNo);
		return entry
			? c.json(toRegistrationResponse(registration, entry), 200)
			: c.json(notFoundMember, 404);
	})
	.openapi(graduationYearRoute, async c => {
		const registration = c.var.registration;
		if (!hasStage(registration, ["code_verified"])) {
			return c.json(stageConflictBody(registration), 409);
		}
		if (remainingAttempts(registration) === 0) {
			return c.json(lockedMessage, 403);
		}
		const entry = await findRoster(registration.memberNo);
		if (!entry) {
			return c.json(notFoundMember, 404);
		}
		const verified = entry.graduationYear === c.req.valid("json").graduationYear;
		// 条件付きの UPDATE にして、同時に送られた回答で回数制限をすり抜けられないようにする
		const [updated] = await getDb()
			.update(registrations)
			.set(
				verified
					? { stage: "year_verified" }
					: { yearFailures: sql`${registrations.yearFailures} + 1` },
			)
			.where(
				and(
					eq(registrations.id, registration.id),
					eq(registrations.stage, "code_verified"),
					lt(registrations.yearFailures, MAX_YEAR_FAILURES),
				),
			)
			.returning();
		if (!updated) {
			const latest = await getDb().query.registrations.findFirst({
				where: eq(registrations.id, registration.id),
			});
			return latest && latest.stage !== "code_verified"
				? c.json(stageConflictBody(latest), 409)
				: c.json(lockedMessage, 403);
		}
		return c.json({ verified, remainingAttempts: remainingAttempts(updated) }, 200);
	})
	.openapi(confirmRoute, async c => {
		let registration = c.var.registration;
		if (!hasStage(registration, ["year_verified", "confirmed"])) {
			return c.json(stageConflictBody(registration), 409);
		}
		const entry = await findRoster(registration.memberNo);
		if (!entry) {
			return c.json(notFoundMember, 404);
		}
		registration = await updateRegistration(registration.id, { stage: "confirmed" });
		return c.json(toRegistrationResponse(registration, entry), 200);
	})
	.openapi(emailRoute, async c => {
		const registration = c.var.registration;
		if (!hasStage(registration, ["confirmed", "email_sent"])) {
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
		const entry = await findRoster(registration.memberNo);
		if (!entry) {
			return c.json(notFoundMember, 404);
		}

		const token = randomToken();
		const verifyUrl = new URL("/register/verify", env.SITE_URL);
		verifyUrl.searchParams.set("token", token);
		// 送信に失敗したときは状態を変えず、再送の待ち時間なしでやり直せるようにする
		try {
			await sendVerificationEmail({ to: email, name: entry.name, verifyUrl: verifyUrl.toString() });
		} catch (error) {
			console.error("確認メールの送信に失敗しました", error);
			return c.json(
				{ message: "確認メールを送信できませんでした。時間をおいて、もう一度お試しください。" },
				502,
			);
		}
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
		return c.json(toRegistrationResponse(updated, entry), 202);
	})
	.openapi(getVerificationRoute, async c => {
		const registration = await findByEmailToken(c.req.valid("query").token);
		const entry = registration ? await findRoster(registration.memberNo) : undefined;
		if (!registration?.email || !entry) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		return c.json({ email: registration.email, member: memberSummary(entry) }, 200);
	})
	.openapi(completeRoute, async c => {
		const { token, password } = c.req.valid("json");
		const registration = await findByEmailToken(token);
		const entry = registration ? await findRoster(registration.memberNo) : undefined;
		if (!registration?.email || !entry) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}

		const db = getDb();
		const memberId = crypto.randomUUID();
		try {
			await db.batch([
				db.insert(members).values({
					id: memberId,
					memberNo: entry.memberNo,
					email: registration.email,
					passwordHash: await hashPassword(password),
					name: entry.name,
					graduationYear: entry.graduationYear,
				}),
				db
					.update(registrations)
					.set({ stage: "completed", emailTokenHash: null })
					.where(eq(registrations.id, registration.id)),
			]);
		} catch (error) {
			// 同じ会員やメールアドレスで先に登録が完了していた場合（UNIQUE 制約違反）
			if (String(error).includes("UNIQUE")) {
				return c.json({ message: "このメールアドレスまたは会員は既に登録されています。" }, 409);
			}
			throw error;
		}
		return c.json(await issueTokens(memberId), 201);
	});
