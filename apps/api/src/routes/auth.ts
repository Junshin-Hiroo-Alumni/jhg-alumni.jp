import { env } from "cloudflare:workers";
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getDb } from "../db/client";
import { members } from "../db/schema";
import { issueTokens, refreshTokens, revokeRefreshToken } from "../lib/auth";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../lib/crypto";
import { clientIp, withinRateLimit } from "../lib/rate-limit";
import { errorResponse, jsonBody, jsonResponse, TokenPairSchema } from "./common";

const loginRoute = createRoute({
	method: "post",
	path: "/v1/auth/login",
	request: jsonBody(z.object({ email: z.string().trim().toLowerCase(), password: z.string() })),
	responses: {
		200: jsonResponse("ログイン成功", TokenPairSchema),
		401: errorResponse("メールアドレスまたはパスワードが違う"),
		429: errorResponse("試行回数が多すぎる"),
	},
});

const refreshRoute = createRoute({
	method: "post",
	path: "/v1/auth/refresh",
	request: jsonBody(z.object({ refreshToken: z.string() })),
	responses: {
		200: jsonResponse("新しいトークン。使ったリフレッシュトークンは無効になる", TokenPairSchema),
		401: errorResponse("リフレッシュトークンが無効または期限切れ"),
	},
});

const logoutRoute = createRoute({
	method: "post",
	path: "/v1/auth/logout",
	request: jsonBody(z.object({ refreshToken: z.string() })),
	responses: {
		204: { description: "ログアウトした（トークンが無効でも 204）" },
	},
});

export const authApp = new OpenAPIHono()
	.openapi(loginRoute, async c => {
		if (!(await withinRateLimit(env.LOGIN_RATE_LIMITER, clientIp(c)))) {
			return c.json({ message: "しばらく時間をおいてから、もう一度お試しください。" }, 429);
		}
		const { email, password } = c.req.valid("json");
		const member = await getDb().query.members.findFirst({ where: eq(members.email, email) });
		// 会員が存在しない場合もハッシュ計算を行い、応答時間から存在を推測されないようにする
		const valid = await verifyPassword(password, member?.passwordHash ?? DUMMY_PASSWORD_HASH);
		if (!member || !valid) {
			return c.json({ message: "メールアドレスまたはパスワードが正しくありません。" }, 401);
		}
		return c.json(await issueTokens(member.id), 200);
	})
	.openapi(refreshRoute, async c => {
		const tokens = await refreshTokens(c.req.valid("json").refreshToken);
		if (!tokens) {
			return c.json({ message: "Unauthorized" }, 401);
		}
		return c.json(tokens, 200);
	})
	.openapi(logoutRoute, async c => {
		await revokeRefreshToken(c.req.valid("json").refreshToken);
		return c.body(null, 204);
	});
