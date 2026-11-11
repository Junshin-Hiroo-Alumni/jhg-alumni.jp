import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { emailChanges, type Member, members } from "../db/schema";
import { type AuthEnv, requireAuth } from "../lib/auth";
import { randomToken, sha256Hex, verifyPassword } from "../lib/crypto";
import { sendEmailChangeEmail } from "../lib/mail";
import { withinRateLimit } from "../lib/rate-limit";
import { bearerSecurity, errorResponse, jsonBody, jsonResponse } from "./common";

const EMAIL_CHANGE_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const EMAIL_CHANGE_COOLDOWN_MS = 60 * 1000;

export const MemberSchema = z
	.object({
		id: z.string(),
		email: z.email(),
		name: z.string(),
		graduationYear: z.int().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("Member");

const getMeRoute = createRoute({
	method: "get",
	path: "/v1/me",
	security: bearerSecurity,
	responses: {
		200: jsonResponse("ログイン中の会員", MemberSchema),
		401: errorResponse("トークンがない、または無効"),
		404: errorResponse("会員が存在しない"),
	},
});

const requestEmailChangeRoute = createRoute({
	method: "post",
	path: "/v1/me/email",
	security: bearerSecurity,
	request: jsonBody(
		z.object({
			email: z.string().trim().toLowerCase().pipe(z.email()),
			currentPassword: z.string().openapi({ description: "本人確認のための現在のパスワード" }),
		}),
	),
	responses: {
		202: jsonResponse(
			"新しいアドレスに確認メールを送った。リンクを開くまでメールアドレスは変わらない",
			z.object({ email: z.string() }),
		),
		401: errorResponse("トークンがない、または無効"),
		403: errorResponse("現在のパスワードが違う"),
		404: errorResponse("会員が存在しない"),
		409: errorResponse("現在と同じアドレス、またはほかの会員が使っている"),
		429: errorResponse("再送信の間隔が短い、または試行回数が多すぎる"),
	},
});

/** パスワードのハッシュや認証コードは返さない */
function toMemberResponse(member: Member) {
	return {
		id: member.id,
		email: member.email,
		name: member.name,
		graduationYear: member.graduationYear,
		createdAt: member.createdAt.toISOString(),
		updatedAt: member.updatedAt.toISOString(),
	};
}

function findMember(id: string) {
	return getDb().query.members.findFirst({ where: eq(members.id, id) });
}

const app = new OpenAPIHono<AuthEnv>();
app.use("/v1/me", requireAuth);
app.use("/v1/me/*", requireAuth);

export const meApp = app
	.openapi(getMeRoute, async c => {
		const member = await findMember(c.var.memberId);
		if (!member) {
			return c.json({ message: "Member not found" }, 404);
		}
		return c.json(toMemberResponse(member), 200);
	})
	.openapi(requestEmailChangeRoute, async c => {
		const { email, currentPassword } = c.req.valid("json");
		const db = getDb();
		// アクセストークンを盗んだ人がパスワードを総当たりできないよう、会員ごとに制限する
		if (!(await withinRateLimit(env.LOGIN_RATE_LIMITER, `email-change:${c.var.memberId}`))) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const member = await findMember(c.var.memberId);
		if (!member) {
			return c.json({ message: "Member not found" }, 404);
		}
		if (!(await verifyPassword(currentPassword, member.passwordHash))) {
			return c.json({ message: "現在のパスワードが正しくありません。" }, 403);
		}
		if (member.email === email) {
			return c.json({ message: "現在と同じメールアドレスです。" }, 409);
		}
		if (await db.query.members.findFirst({ where: eq(members.email, email) })) {
			return c.json({ message: "このメールアドレスは既に使われています。" }, 409);
		}
		const latest = await db.query.emailChanges.findFirst({
			where: eq(emailChanges.memberId, member.id),
			orderBy: desc(emailChanges.createdAt),
		});
		if (latest && Date.now() - latest.createdAt.getTime() < EMAIL_CHANGE_COOLDOWN_MS) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}

		const token = randomToken();
		await db.batch([
			// 以前の申請は無効にし、最後に申請したアドレスだけを有効にする
			db.delete(emailChanges).where(eq(emailChanges.memberId, member.id)),
			db.insert(emailChanges).values({
				memberId: member.id,
				newEmail: email,
				tokenHash: await sha256Hex(token),
				expiresAt: new Date(Date.now() + EMAIL_CHANGE_TOKEN_TTL_MS),
			}),
		]);
		const confirmUrl = new URL("/verify-email", env.SITE_URL);
		confirmUrl.searchParams.set("token", token);
		await sendEmailChangeEmail({ to: email, name: member.name, confirmUrl: confirmUrl.toString() });
		return c.json({ email }, 202);
	});
