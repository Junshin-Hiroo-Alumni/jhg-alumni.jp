# API Worker

会員向け機能の API です（Hono + D1 / Drizzle）。`apps/web` の loader / action から `~/lib/api.server` の `createApiClient` で呼び出します。API 仕様は開発サーバーの `/ui` で確認できます。

## ローカル開発

- メールは送信せず、リンクを API のログ（`bun run dev` のターミナル）に出します。
- 認証コードとクイズは `src/data/*.json` のダミーデータです。クイズの正解も同じファイルにあります。
- `bun run db:seed` で登録済みの会員（`jiro@example.com` / `password123`）が入ります。
- 認証コードは 1 回しか使えません。登録をやり直すときは `bun run db:reset` を実行します。
