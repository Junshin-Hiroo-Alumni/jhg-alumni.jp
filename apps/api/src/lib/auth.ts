import { createMiddleware } from "hono/factory";
import { verify } from "hono/jwt";

/** 発行者（`iss`）。現在は apps/web がログイン後に発行する */
export const JWT_ISSUER = "jhg-alumni-web";
/** 対象（`aud`） */
export const JWT_AUDIENCE = "jhg-alumni-api";
/** `JWT_SECRET` 未設定時（ローカル開発）の署名鍵。本番では必ず `JWT_SECRET` を設定する */
export const DEV_JWT_SECRET = "local-dev-secret";

export type AuthEnv = {
	// biome-ignore lint/style/useNamingConvention: Hono の Env 型のキー
	Bindings: { JWT_SECRET?: string };
	// biome-ignore lint/style/useNamingConvention: Hono の Env 型のキー
	Variables: { memberId: string };
};

function unauthorized(error?: "invalid_token") {
	return new Response(JSON.stringify({ message: "Unauthorized" }), {
		status: 401,
		headers: {
			"Content-Type": "application/json",
			"WWW-Authenticate": error ? `Bearer error="${error}"` : "Bearer",
		},
	});
}

/**
 * `Authorization: Bearer <JWT>` を検証し、`sub` を `c.var.memberId` に格納する
 *
 * HS256 で署名され、`iss` / `aud` / `exp` を持つトークンのみ受け付ける。
 */
export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
	const token = c.req.header("Authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
	if (!token) {
		return unauthorized();
	}
	try {
		const payload = await verify(token, c.env.JWT_SECRET || DEV_JWT_SECRET, {
			alg: "HS256",
			iss: JWT_ISSUER,
			aud: JWT_AUDIENCE,
		});
		if (typeof payload.sub !== "string" || typeof payload.exp !== "number") {
			return unauthorized("invalid_token");
		}
		c.set("memberId", payload.sub);
	} catch {
		return unauthorized("invalid_token");
	}
	await next();
});
