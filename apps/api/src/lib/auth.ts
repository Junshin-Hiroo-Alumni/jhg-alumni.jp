import { env } from "cloudflare:workers";
import { and, eq, gt } from "drizzle-orm";
import { createMiddleware } from "hono/factory";
import { sign, verify } from "hono/jwt";
import { getDb } from "../db/client";
import { sessions } from "../db/schema";
import { randomToken, sha256Hex } from "./crypto";
import { ACCESS_TOKEN_TTL_SECONDS, DEV_JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER } from "./jwt";

/** リフレッシュトークン（セッション）の有効期間 */
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthEnv = {
	// biome-ignore lint/style/useNamingConvention: Hono の Env 型のキー
	Variables: { memberId: string };
};

function jwtSecret(): string {
	return env.JWT_SECRET || DEV_JWT_SECRET;
}

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
		const payload = await verify(token, jwtSecret(), {
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

export type TokenPair = {
	accessToken: string;
	refreshToken: string;
	/** アクセストークンの有効期間（秒） */
	expiresIn: number;
	/** リフレッシュトークンの有効期間（秒） */
	refreshExpiresIn: number;
};

async function signAccessToken(memberId: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	return await sign(
		{
			sub: memberId,
			iss: JWT_ISSUER,
			aud: JWT_AUDIENCE,
			iat: now,
			exp: now + ACCESS_TOKEN_TTL_SECONDS,
		},
		jwtSecret(),
		"HS256",
	);
}

/** アクセストークンと、新しいセッションのリフレッシュトークンを発行する */
export async function issueTokens(memberId: string): Promise<TokenPair> {
	const refreshToken = randomToken();
	await getDb()
		.insert(sessions)
		.values({
			memberId,
			tokenHash: await sha256Hex(refreshToken),
			expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
		});
	return {
		accessToken: await signAccessToken(memberId),
		refreshToken,
		expiresIn: ACCESS_TOKEN_TTL_SECONDS,
		refreshExpiresIn: REFRESH_TOKEN_TTL_MS / 1000,
	};
}

/**
 * リフレッシュトークンを使って新しいトークンを発行する
 *
 * 使ったリフレッシュトークンは無効にする（ローテーション）。無効なトークンなら null。
 */
export async function refreshTokens(refreshToken: string): Promise<TokenPair | null> {
	const [session] = await getDb()
		.delete(sessions)
		.where(
			and(
				eq(sessions.tokenHash, await sha256Hex(refreshToken)),
				gt(sessions.expiresAt, new Date()),
			),
		)
		.returning();
	return session ? await issueTokens(session.memberId) : null;
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
	await getDb()
		.delete(sessions)
		.where(eq(sessions.tokenHash, await sha256Hex(refreshToken)));
}
