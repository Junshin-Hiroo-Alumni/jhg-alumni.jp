import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, gt } from "drizzle-orm";
import { getDb } from "../db/client";
import { members, passwordResets, sessions } from "../db/schema";
import { issueTokens } from "../lib/auth";
import { hashPassword, randomToken, sha256Hex } from "../lib/crypto";
import { sendPasswordResetEmail } from "../lib/mail";
import { clientIp, withinRateLimit } from "../lib/rate-limit";
import { errorResponse, jsonBody, jsonResponse, PasswordSchema, TokenPairSchema } from "./common";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
/** 同じ会員への再設定メールの最短間隔 */
const RESET_EMAIL_COOLDOWN_MS = 60 * 1000;

const INVALID_LINK_MESSAGE = "リンクが無効か、有効期限が切れています。";

const requestRoute = createRoute({
	method: "post",
	path: "/v1/auth/password-reset",
	request: jsonBody(z.object({ email: z.string().trim().toLowerCase().pipe(z.email()) })),
	responses: {
		202: jsonResponse(
			"受け付けた。登録されているかどうかに関わらず同じ応答を返す",
			z.object({ message: z.string() }),
		),
		429: errorResponse("試行回数が多すぎる"),
	},
});

const getRoute = createRoute({
	method: "get",
	path: "/v1/auth/password-reset",
	request: { query: z.object({ token: z.string() }) },
	responses: {
		200: jsonResponse("再設定リンクが有効", z.object({ email: z.string() })),
		404: errorResponse("リンクが無効または期限切れ"),
	},
});

const confirmRoute = createRoute({
	method: "post",
	path: "/v1/auth/password-reset/confirm",
	request: jsonBody(z.object({ token: z.string(), password: PasswordSchema })),
	responses: {
		200: jsonResponse(
			"パスワードを変更してログインした。ほかのセッションはすべて無効になる",
			TokenPairSchema,
		),
		404: errorResponse("リンクが無効または期限切れ"),
	},
});

async function findValidReset(token: string) {
	return await getDb().query.passwordResets.findFirst({
		where: and(
			eq(passwordResets.tokenHash, await sha256Hex(token)),
			gt(passwordResets.expiresAt, new Date()),
		),
	});
}

export const passwordResetApp = new OpenAPIHono()
	.openapi(requestRoute, async c => {
		if (!(await withinRateLimit(env.RESET_RATE_LIMITER, clientIp(c)))) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const { email } = c.req.valid("json");
		const db = getDb();
		const member = await db.query.members.findFirst({ where: eq(members.email, email) });
		if (member) {
			const latest = await db.query.passwordResets.findFirst({
				where: eq(passwordResets.memberId, member.id),
				orderBy: desc(passwordResets.createdAt),
			});
			if (!latest || Date.now() - latest.createdAt.getTime() >= RESET_EMAIL_COOLDOWN_MS) {
				const token = randomToken();
				await db.insert(passwordResets).values({
					memberId: member.id,
					tokenHash: await sha256Hex(token),
					expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
				});
				const resetUrl = new URL("/reset-password", env.SITE_URL);
				resetUrl.searchParams.set("token", token);
				// 送信を待たずに応答し、応答時間から登録の有無を推測されないようにする
				c.executionCtx.waitUntil(
					sendPasswordResetEmail({
						to: member.email,
						name: member.name,
						resetUrl: resetUrl.toString(),
					}).catch(error => console.error("failed to send password reset email", error)),
				);
			}
		}
		return c.json(
			{ message: "登録されているメールアドレスの場合、再設定用のメールを送信しました。" },
			202,
		);
	})
	.openapi(getRoute, async c => {
		const reset = await findValidReset(c.req.valid("query").token);
		const member = reset
			? await getDb().query.members.findFirst({ where: eq(members.id, reset.memberId) })
			: undefined;
		if (!member) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		return c.json({ email: member.email }, 200);
	})
	.openapi(confirmRoute, async c => {
		const { token, password } = c.req.valid("json");
		const reset = await findValidReset(token);
		if (!reset) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		const db = getDb();
		await db.batch([
			db
				.update(members)
				.set({ passwordHash: await hashPassword(password) })
				.where(eq(members.id, reset.memberId)),
			// 使ったリンクと、ほかの端末のログインをすべて無効にする
			db.delete(passwordResets).where(eq(passwordResets.memberId, reset.memberId)),
			db.delete(sessions).where(eq(sessions.memberId, reset.memberId)),
		]);
		return c.json(await issueTokens(reset.memberId), 200);
	});
