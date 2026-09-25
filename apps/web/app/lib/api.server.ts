import { env } from "cloudflare:workers";
import type { AppType } from "@repo/api";
import { hc } from "hono/client";
import { sign } from "hono/jwt";

/** `apps/api` の `JWT_ISSUER` / `JWT_AUDIENCE` と一致させる */
const JWT_ISSUER = "jhg-alumni-web";
const JWT_AUDIENCE = "jhg-alumni-api";
/** `JWT_SECRET` 未設定時（ローカル開発）の署名鍵。`apps/api` の `DEV_JWT_SECRET` と一致させる */
const DEV_JWT_SECRET = "local-dev-secret";
const TOKEN_TTL_SECONDS = 5 * 60;

/** 会員 ID を `sub` とする API 用の JWT を発行する */
export async function signApiToken(memberId: string): Promise<string> {
	const now = Math.floor(Date.now() / 1000);
	return await sign(
		{
			sub: memberId,
			iss: JWT_ISSUER,
			aud: JWT_AUDIENCE,
			iat: now,
			exp: now + TOKEN_TTL_SECONDS,
		},
		env.JWT_SECRET || DEV_JWT_SECRET,
		"HS256",
	);
}

/**
 * `apps/api` を呼ぶ型付き Hono Client
 *
 * Service Binding 経由で呼ぶため、loader / action などサーバー側からのみ使う。
 * `memberId` を渡すと、その会員の JWT を `Authorization` ヘッダーに付ける（ログイン機能は未実装）。
 */
export function createApiClient(options: { memberId?: string } = {}) {
	const { memberId } = options;
	return hc<AppType>("https://api.internal", {
		fetch: env.API.fetch.bind(env.API),
		headers: async (): Promise<Record<string, string>> =>
			// biome-ignore lint/style/useNamingConvention: HTTP header name
			memberId ? { Authorization: `Bearer ${await signApiToken(memberId)}` } : {},
	});
}
