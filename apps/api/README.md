# API Worker

会員向け機能の API です（Hono + D1 / Drizzle）。`apps/web` の loader / action から `~/lib/api.server` の `createApiClient` で呼び出します。API 仕様は開発サーバーの `/ui` で確認できます。

## ローカル開発

- `.env.example` を `.dev.vars` にコピーして `JWT_SECRET` を設定します（未設定だとログインや登録でエラーになります）。
- メールは送信せず、リンクを API のログ（`bun run dev` のターミナル）に出します。
- 名簿は下記の「名簿の取り込み」の手順で、ローカルの D1 に入れます（`--remote` を付けない）。

## 名簿の取り込み

事務局から受け取った名簿 CSV（[Authentication-Code-Generator](https://github.com/Tomoro0726/Authentication-Code-Generator) で認証コードを書き込んだもの）を D1 の `roster` テーブルに取り込みます。認証コードは SHA-256 のハッシュだけを保存します。

```sh
cd apps/api
bun run roster:import <CSV ファイル> --check   # 検証だけ（D1 に書き込まない）
bun run roster:import <CSV ファイル> --remote  # 本番の D1 に取り込む
```

- 列は A 索引記号 / B 会員No. / C 卒年(和暦) / D 卒年(西暦) / E 現姓 / F 旧姓 / G 名前 / H 旧名 / I 発送不可フラグ / J 以降 認証コード です。
- 発送不可（I 列が `1`）の行と空行は取り込みません。それ以外の行は、会員No.・卒年(西暦)・名前・認証コードがそろっていないと全体を中止します。
- 取り込むたびに CSV の内容で置き換え、CSV にない行は削除します。登録済みの会員（`members`）は残ります。
- CSV は個人情報なので、リポジトリに置かないでください（`*.csv` は `.gitignore` で除外しています）。

## メール送信

本番では Cloudflare Email Sending（`send_email` バインディング）で送ります。送信元 `MAIL_FROM` のドメインを、ダッシュボードの Compute > Email Service > Email Sending で Onboard Domain しておく必要があります。
