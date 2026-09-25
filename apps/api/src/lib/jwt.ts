// cloudflare:workers に依存しない JWT の設定（scripts/dev-token.ts からも使う）

/** 発行者（`iss`）と対象（`aud`） */
export const JWT_ISSUER = "jhg-alumni-api";
export const JWT_AUDIENCE = "jhg-alumni-api";
/** `JWT_SECRET` 未設定時（ローカル開発）の署名鍵。本番では必ず `JWT_SECRET` を設定する */
export const DEV_JWT_SECRET = "local-dev-secret";
/** アクセストークンの有効期間 */
export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
