バグ報告・機能提案・ドキュメント修正・テスト追加など、あらゆる貢献を歓迎します。


>[!WARNING]
>原則として順心女子学園か広尾学園の卒業生からのContributeのみを受け付けています。その他の方がContributeしていただける場合にはお手数ですがIssueなどでご一報ください。

## Contributeの手順

1. **本リポジトリを fork する**
2. **ローカルで作業用 branch を作成**
   - ブランチ名は`<種別>/<短い説明>
   - 種別
     - `feat` → 新機能
     - `fix` → バグ修正
     - `docs` → ドキュメント修正
     - `refactor` → リファクタリング
     - `chore` → 雑務（CI 設定、依存パッケージ更新など）
   - 例:`feat/user-auth`
3. **開発・commit**
   - commit メッセージは任意の短い説明を使用してください
4. **`bun run ci` を実行して通ることを確認**
   - 詳細は[CIチェックについて](#ciチェックについて)を参照してください
5. **GitHub に push**
6. **Pull Request**
   - タイトルは簡潔につけてください
	 - 変更の理由、実装箇所を必ず記入してください
	 - 変更により破壊的変更が行われる場合はその旨を必ず記入してください

## CIチェックについて

Pull Request を出す前に、リポジトリのルートで以下を実行し、エラーなく通ることを確認してください。

```sh
bun run ci
```

`bun run ci` は次の2つを順に実行します。

| 内訳 | コマンド | 内容 |
| --- | --- | --- |
| Lint / Format チェック | `biome ci .` | [Biome](https://biomejs.dev/) によるコードの静的解析、フォーマット、import の並び順のチェック |
| 型チェック | `bun run typecheck` | `turbo run check-types` により各アプリの型を検証（`apps/web`: `wrangler types` → `react-router typegen` → `tsc`、`apps/api`: `tsc --noEmit`） |

Biome の指摘は、次のコマンドで自動修正できるものがあります。

```sh
bun run check
```


