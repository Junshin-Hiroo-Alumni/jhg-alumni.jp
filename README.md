# 順心広尾学園同窓会 公式WEBサイト
このサイトは以下の機能を提供します。

- 同窓会の情報発信
	- 同窓会の活動の発信
	- 規約 / 総会記録等の発信
	- お知らせの掲載

### 今後の予定

- 会員マイページの提供（会員情報の編集、会員同士の交流）

## 構成技術

- React / React Router (v7)
- Radix UI (`@radix-ui/themes`)
- Hono（API）
- Turborepo（モノレポ管理）
- Biome（Lint / Format）
- Cloudflare Workers（フロントエンドのデプロイ先 / [デプロイ手順](./docs/web/deployment.md)）


## 開発の開始方法

1. パッケージのインストール
ルートディレクトリで以下のコマンドを実行し、依存関係をインストールします。
```sh
bun install
```

2. 環境変数の設定
環境変数の詳細や設定方法については、[`docs`](./docs) ディレクトリ内のドキュメント（`api/environment-variables.md` および `web/environment-variables.md`）を参照してください。
> 【重要】
> 開発環境の割り当て（データベースや各種APIキーなどの情報）については、担当者に問い合わせてください。

3. 開発サーバーの起動
以下のコマンドを実行すると、フロントエンドとバックエンドのローカル開発サーバーが同時に立ち上がります。
```sh
bun run dev
```

## コマンド一覧

ルートディレクトリの `package.json` で定義されている主なコマンドです。必要に応じて実行してください。

| コマンド | 説明 |
| --- | --- |
| `bun run dev` | 開発サーバーを起動します。 |
| `bun run build` | 本番環境向けにビルドを実行します。 |
| `bun run typecheck` | プロジェクト全体の TypeScript の型チェックを行います。 |
| `bun run lint` | Biome を使用してコードの静的解析を行います。 |
| `bun run format` | Biome でコードをフォーマットします。 |
| `bun run check` | Biome による Lint / Format の修正適用と型チェックを実行します。 |
| `bun run ci` | CI 用に Biome のチェック（`biome ci`）と型チェックを実行します（修正は行いません）。 |
| `bun run clean` | ビルド成果物・キャッシュを削除します。 |
| `bun run clean:all` | キャッシュに加えて、すべての `node_modules` を削除し初期化します。 |
| `bun run compress:gallery` | フォトギャラリーの画像を Web 用に最適化します（下記参照）。 |

## フォトギャラリーの画像追加

画像を追加したら、最適化コマンドを実行してください。

```sh
bun run compress:gallery
```
