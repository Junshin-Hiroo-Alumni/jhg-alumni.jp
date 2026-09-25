# API Worker

会員向け機能の API です（Hono + D1 / Drizzle）。`apps/web` の loader / action から `~/lib/api.server` の `createApiClient` で呼び出します。API 仕様は開発サーバーの `/ui` で確認できます。

認証は `Authorization: Bearer <JWT>`（HS256、`iss` / `aud` / `exp` 必須、`sub` が会員 ID）です。ログイン機能ができるまでは、`bun run --cwd apps/api dev:token` でサンプル会員のトークンを発行して `/ui` の Authorize から試せます。
