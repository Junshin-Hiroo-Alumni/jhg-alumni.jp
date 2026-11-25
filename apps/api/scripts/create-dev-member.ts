// 開発用の会員をローカルの D1 に作る。会員登録の手順（名簿・認証コード・確認メール）を飛ばして
// マイページを確認するためのもの。本番の D1 には書き込めない。
//
// 使い方: pnpm run dev:member [--email <アドレス>] [--password <パスワード>] [--name <名前>] [--year <卒業年>]
//   同じメールアドレスの会員がいれば、パスワード・名前・卒業年を上書きする。
//   --year に junior-high を渡すと中学卒業（null）になる。
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { hashPassword } from "../src/lib/crypto.ts";

const { values } = parseArgs({
	options: {
		email: { type: "string", default: "dev@example.com" },
		password: { type: "string", default: "password1234" },
		name: { type: "string", default: "開発 太郎" },
		year: { type: "string", default: "2020" },
	},
});

const email = values.email.trim().toLowerCase();
const graduationYear = values.year === "junior-high" ? null : Number(values.year);
if (graduationYear !== null && !Number.isInteger(graduationYear)) {
	console.error(`卒業年が不正です: "${values.year}"`);
	process.exit(1);
}
// API の PasswordSchema と同じ制約。満たさないとパスワード変更などで困るため揃える
if (values.password.length < 12 || values.password.length > 128) {
	console.error("パスワードは 12〜128 文字にしてください。");
	process.exit(1);
}

const sqlString = (value: string) => `'${value.replaceAll("'", "''")}'`;
const now = Date.now();
const sql = `INSERT INTO members (id, member_no, email, password_hash, name, graduation_year, created_at, updated_at) VALUES (${[
	sqlString(crypto.randomUUID()),
	// 名簿の会員番号と衝突しないよう、実在しない形式にする
	sqlString(`DEV:${email}`),
	sqlString(email),
	sqlString(await hashPassword(values.password)),
	sqlString(values.name),
	graduationYear ?? "NULL",
	now,
	now,
].join(
	", ",
)}) ON CONFLICT (email) DO UPDATE SET password_hash = excluded.password_hash, name = excluded.name, graduation_year = excluded.graduation_year, updated_at = excluded.updated_at;`;

const run = (args: string[]) =>
	spawnSync("pnpm", ["exec", "wrangler", ...args], {
		cwd: join(import.meta.dirname, ".."),
		stdio: "inherit",
		// Windows では pnpm が .cmd のため、シェル経由でないと起動できない
		shell: process.platform === "win32",
	}).status;

// 名前や日本語をシェルの引数で渡すと Windows で崩れるため、ファイル経由で渡す
const dir = mkdtempSync(join(tmpdir(), "dev-member-"));
const sqlPath = join(dir, "member.sql");
let status: number | null;
try {
	writeFileSync(sqlPath, sql);
	status = run(["d1", "migrations", "apply", "DB", "--local"]);
	if (status === 0) {
		status = run(["d1", "execute", "DB", "--local", `--file=${sqlPath}`]);
	}
} finally {
	rmSync(dir, { recursive: true, force: true });
}
if (status === 0) {
	console.info(
		`\n開発用の会員を作成しました。\n  メールアドレス: ${email}\n  パスワード: ${values.password}`,
	);
}
// process.exit は finally を飛ばすので、一時ファイルを消してから終了する
process.exit(status ?? 1);
