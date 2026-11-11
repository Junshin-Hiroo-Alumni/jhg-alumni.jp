# 順心広尾学園同窓会 公式WEBサイト

同窓会の活動を発信するサイトです。会員マイページの機能も提供します。

**構成技術:** React Router (v7) / Radix UI / Hono / Turborepo / Biome / Cloudflare Workers

## 開発の開始方法

```sh
pnpm install
pnpm run dev
```

`pnpm run dev` で起動するサーバーは次のとおりです。ブラウザでは Web を開きます。API と OG Image は Web から Service Binding 経由で呼ばれ、`/ui` で OpenAPI ドキュメントを確認できます。

| サーバー | URL |
| --- | --- |
| Web（`apps/web`） | `http://localhost:3000` |
| API（`apps/api`） | `http://localhost:3001` |
| OG Image（`apps/ogimage`） | `http://localhost:3002` |

API の環境変数は [`apps/api/README.md`](apps/api/README.md)、Web の環境変数は [`docs/web/environment-variables.md`](docs/web/environment-variables.md) を参照してください。

## コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `pnpm run dev` | 開発サーバーを起動 |
| `pnpm run build` | 本番向けビルド |
| `pnpm run typecheck` | 型チェック |
| `pnpm run lint` / `format` | Biome で Lint / フォーマット |
| `pnpm run check` | Biome の修正適用と型チェック |
| `pnpm run ci` | CI 用チェック（修正なし） |
| `pnpm run clean` | ビルド成果物・キャッシュを削除 |
| `pnpm run clean:all` | キャッシュに加えて、すべての `node_modules` を削除 |
| `pnpm run compress:gallery` | ギャラリー画像を Web 用に最適化（画像を追加したら実行） |
| `pnpm run db:generate` | スキーマの変更からマイグレーション SQL を生成 |
| `pnpm run db:migrate` | ローカルの D1 にマイグレーションを適用（`dev` 起動時にも自動実行） |
| `pnpm run db:migrate:remote` | 本番の D1 にマイグレーションを適用 |

## データベースのスキーマ変更

`apps/api/src/db/schema.ts` を編集し、`pnpm run db:generate` → `pnpm run db:migrate` を実行します。生成された `apps/api/migrations/` の SQL もコミットしてください。
