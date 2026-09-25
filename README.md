# 順心広尾学園同窓会 公式WEBサイト

同窓会の活動を発信するサイトです。会員マイページの機能も提供します。

**構成技術:** React Router (v7) / Radix UI / Hono / Turborepo / Biome / Cloudflare Workers

## 開発の開始方法

```sh
bun install
bun run dev
```

`bun run dev` で起動するサーバーは次のとおりです。ブラウザでは Web を開きます。API と OG Image は Web から Service Binding 経由で呼ばれ、`/ui` で OpenAPI ドキュメントを確認できます。

| サーバー | URL |
| --- | --- |
| Web（`apps/web`） | `http://localhost:3000` |
| API（`apps/api`） | `http://localhost:3001` |
| OG Image（`apps/ogimage`） | `http://localhost:3002` |

## コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `bun run dev` | 開発サーバーを起動 |
| `bun run build` | 本番向けビルド |
| `bun run typecheck` | 型チェック |
| `bun run lint` / `format` | Biome で Lint / フォーマット |
| `bun run check` | Biome の修正適用と型チェック |
| `bun run ci` | CI 用チェック（修正なし） |
| `bun run clean` | ビルド成果物・キャッシュ・すべての `node_modules` を削除 |
| `bun run compress:gallery` | ギャラリー画像を Web 用に最適化（画像を追加したら実行） |
| `bun run db:generate` | スキーマの変更からマイグレーション SQL を生成 |
| `bun run db:migrate` | ローカルの D1 にマイグレーションを適用（`dev` 起動時にも自動実行） |
| `bun run db:migrate:remote` | 本番の D1 にマイグレーションを適用 |
| `bun run db:seed` | ローカルの D1 にサンプルデータ（`apps/api/seed/dev.sql`）を投入 |

## データベースのスキーマ変更

`apps/api/src/db/schema.ts` を編集し、`bun run db:generate` → `bun run db:migrate` を実行します。生成された `apps/api/migrations/` の SQL もコミットしてください。
