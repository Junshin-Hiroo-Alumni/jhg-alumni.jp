# Web: Cloudflare へのデプロイ

`apps/web`（React Router v7 / SSR）を **Cloudflare Workers + Static Assets** にデプロイします。

実行環境は **bun** を前提とします。

## 仕組みと前提

- アプリは Cloudflare Workers 上で SSR されます。エントリは [`apps/web/workers/app.ts`](../../apps/web/workers/app.ts)、設定は [`apps/web/wrangler.jsonc`](../../apps/web/wrangler.jsonc) です。
- `apps/web/public/` 配下の画像などは **Static Assets** として配信されます。`@cloudflare/vite-plugin` がビルド時に `build/client` をアセットディレクトリへ自動割り当てします。
- **Worker スクリプト本体のサイズ制限（無料 1MB / 有料 10MB）は SSR バンドルのみが対象**で、画像はこの制限にカウントされません。画像が増えても Worker のサイズは変わりません。
- 静的アセットの**配信リクエスト・転送量は無料・無制限**（Free / Paid 共通）。課金対象は Worker の実行（SSR リクエスト）のみです。
  - アセットの上限：**1 ファイル 25 MiB / 最大 20,000 ファイル**。

## 事前準備

1. Cloudflare アカウントを用意します。
2. wrangler でログインします（初回のみ）。

```sh
cd apps/web
bunx wrangler login
```

## ローカルからのデプロイ

`apps/web` で deploy スクリプトを実行します。`react-router build` の後に `wrangler deploy` が走ります。

```sh
cd apps/web
bun run deploy
```

ビルドにより `apps/web/.wrangler/deploy/config.json` が生成され、`wrangler deploy` はそこから解決済み設定（`build/server/wrangler.json`）を参照してデプロイします。

### デプロイ前の確認（任意）

実際にアップロードせず、内容とサイズだけ確認できます。

```sh
cd apps/web
bun run build
bunx wrangler deploy --dry-run
```

- `Total Upload ... gzip` の値が Worker バンドルのサイズ（1MB / 10MB 制限の判定対象）です。
- `Read N files from the assets directory` がアセット（画像など）の件数です。これらは制限・課金の対象外です。

### ローカルでの本番プレビュー（任意）

```sh
cd apps/web
bun run preview
```

## Git 連携での自動デプロイ（Workers Builds）

Cloudflare ダッシュボードからリポジトリを接続し、push 時に自動ビルド＆デプロイできます。

1. ダッシュボード → **Workers & Pages** → **Create** → **Workers** → **Connect to Git**
2. GitHub / GitLab を認可し、対象リポジトリを選択します。
3. このリポジトリは bun + Turborepo のモノレポ（`apps/web`）のため、ビルド設定を次のようにします。

   | 項目 | 値 |
   | --- | --- |
   | Root directory | `apps/web` |
   | Build command | `bun run build` |
   | Deploy command | `bunx wrangler deploy` |

   > サブディレクトリでの依存解決が不安定な場合は、Root をリポジトリルートのままにし、Build command を `bunx turbo run build --filter=web`、Deploy command を `bunx wrangler deploy --config apps/web/wrangler.jsonc` に切り替えてください。

4. 以降は push のたびに自動でビルド・デプロイされます。

## 環境変数・シークレット

- ローカル開発の環境変数は [環境変数ドキュメント](./environment-variables.md) を参照してください。
- ビルド時に必要な `VITE_` 系の変数は、Git 連携の場合 Workers Builds の **Settings → Variables and Secrets** に登録します（`VITE_` 系はビルド時にバンドルへ埋め込まれます）。
- Worker 実行時のシークレットは `bunx wrangler secret put <NAME>` で登録します。

## 関連ファイル

| ファイル | 役割 |
| --- | --- |
| [`apps/web/wrangler.jsonc`](../../apps/web/wrangler.jsonc) | Cloudflare Workers 設定 |
| [`apps/web/workers/app.ts`](../../apps/web/workers/app.ts) | Worker エントリ（SSR リクエストハンドラ） |
| [`apps/web/app/entry.server.tsx`](../../apps/web/app/entry.server.tsx) | サーバーレンダリング（Web Streams） |
| [`apps/web/react-router.config.ts`](../../apps/web/react-router.config.ts) | React Router 設定（`v8_viteEnvironmentApi` 等） |
| [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts) | Vite 設定（`@cloudflare/vite-plugin`） |
