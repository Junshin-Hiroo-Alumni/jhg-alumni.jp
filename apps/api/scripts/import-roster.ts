// 認証コードを書き込んだ名簿 CSV を D1 の roster テーブルに取り込む。
//
// 使い方: bun run roster:import <CSV ファイル> [--remote | --check]
//   --remote を付けないとローカルの D1 に取り込む。--check は検証だけ行い、D1 には書き込まない。
//
// CSV は Authentication-Code-Generator の出力（ヘッダーなし、UTF-8）。
//   A 索引記号 / B 会員No. / C 卒年(和暦) / D 卒年(西暦) / E 現姓 / F 旧姓 / G 名前 / H 旧名 / I 発送不可フラグ
//   J 列以降: 認証コード（ツールを再実行すると右の列に追記されるため、最も右のコードを使う）
//
// 取り込みのたびに CSV の内容で置き換え、CSV にない行は削除する。
// 認証コードは SHA-256 のハッシュだけを保存する。
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MEMBER_CODE_PATTERN } from "../src/lib/member-code";

const COLUMN = {
	indexSymbol: 0,
	memberNo: 1,
	graduationYear: 3,
	surname: 4,
	formerSurname: 5,
	givenName: 6,
	formerGivenName: 7,
	undeliverable: 8,
	firstCode: 9,
} as const;

/** 索引記号がこの値の行は中学校の卒業生で、卒年が空になっている */
const JUNIOR_HIGH_INDEX_SYMBOL = "中学卒業";

type RosterRow = {
	memberNo: string;
	codeHash: string;
	/** 中学卒業は null */
	graduationYear: number | null;
	name: string;
	formerName: string | null;
};

// 引用符で囲んだフィールド（カンマ・改行・"" を含められる）か、囲まないフィールド
const CSV_FIELD = /("(?:[^"]|"")*"|[^,"\r\n]*)(,|\r?\n|$)/y;

function parseCsv(text: string): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	CSV_FIELD.lastIndex = 0;
	while (CSV_FIELD.lastIndex < text.length) {
		const match = CSV_FIELD.exec(text);
		if (!match) {
			throw new Error(`CSV を解釈できません（${CSV_FIELD.lastIndex} 文字目）`);
		}
		const [, raw = "", separator] = match;
		row.push(raw.startsWith('"') ? raw.slice(1, -1).replaceAll('""', '"') : raw);
		if (separator !== ",") {
			rows.push(row);
			row = [];
		}
	}
	if (row.length > 0) {
		rows.push([...row, ""]);
	}
	return rows;
}

const isBlank = (value: string) => value.trim() === "";

type ParsedLine = { row: RosterRow; code: string } | { errors: string[] } | null;

/** 1 行を検証して変換する。コードを発行しない行（空行・発送不可）は null */
function parseLine(raw: string[]): ParsedLine {
	const cell = (column: number) => (raw[column] ?? "").trim();
	if (raw.every(isBlank)) {
		return null;
	}
	const code = raw
		.slice(COLUMN.firstCode)
		.findLast(value => !isBlank(value))
		?.trim();
	if (cell(COLUMN.undeliverable) === "1") {
		return code ? { errors: ["発送不可なのに認証コードがあります"] } : null;
	}

	const memberNo = cell(COLUMN.memberNo);
	const isJuniorHigh =
		cell(COLUMN.indexSymbol) === JUNIOR_HIGH_INDEX_SYMBOL && cell(COLUMN.graduationYear) === "";
	const graduationYear = isJuniorHigh ? null : Number(cell(COLUMN.graduationYear));
	const surname = cell(COLUMN.surname);
	const givenName = cell(COLUMN.givenName);
	const errors = [
		!memberNo && "会員No. が空です",
		graduationYear !== null &&
			!(Number.isInteger(graduationYear) && graduationYear >= 1900 && graduationYear <= 2100) &&
			`卒年(西暦) が不正です: "${cell(COLUMN.graduationYear)}"`,
		!(surname || givenName) && "現姓と名前が両方とも空です",
		!code && "認証コードがありません",
		code && !MEMBER_CODE_PATTERN.test(code) && "認証コードの形式が不正です",
	].filter(message => typeof message === "string");
	if (errors.length > 0 || !code) {
		return { errors };
	}

	return {
		code,
		row: {
			memberNo,
			codeHash: createHash("sha256").update(code).digest("hex"),
			graduationYear,
			...toNames(cell),
		},
	};
}

/** 現姓・名前と、旧姓・旧名で組み立てた名前（旧姓も旧名もなければ null） */
function toNames(cell: (column: number) => string): Pick<RosterRow, "name" | "formerName"> {
	const surname = cell(COLUMN.surname);
	const givenName = cell(COLUMN.givenName);
	const formerSurname = cell(COLUMN.formerSurname);
	const formerGivenName = cell(COLUMN.formerGivenName);
	const join = (...parts: string[]) => parts.filter(Boolean).join(" ");
	return {
		name: join(surname, givenName),
		formerName:
			formerSurname || formerGivenName
				? join(formerSurname || surname, formerGivenName || givenName)
				: null,
	};
}

function toRosterRows(csv: string[][]): { rows: RosterRow[]; errors: string[] } {
	const rows: RosterRow[] = [];
	const errors: string[] = [];
	const seenCodes = new Set<string>();
	const seenNos = new Set<string>();
	for (const [index, raw] of csv.entries()) {
		const parsed = parseLine(raw);
		if (parsed === null) {
			continue;
		}
		const lineErrors =
			"errors" in parsed
				? parsed.errors
				: [
						seenNos.has(parsed.row.memberNo) && `会員No. が重複しています: ${parsed.row.memberNo}`,
						seenCodes.has(parsed.code) && "認証コードが重複しています",
					].filter(message => typeof message === "string");
		if (lineErrors.length > 0 || "errors" in parsed) {
			errors.push(...lineErrors.map(message => `${index + 1} 行目: ${message}`));
			continue;
		}
		seenNos.add(parsed.row.memberNo);
		seenCodes.add(parsed.code);
		rows.push(parsed.row);
	}
	return { rows, errors };
}

const sqlString = (value: string | null) =>
	value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;

function toSql(rows: RosterRow[], importedAt: number): string {
	const upserts = rows.map(
		row =>
			`INSERT INTO roster (member_no, code_hash, graduation_year, name, former_name, imported_at) VALUES (${[
				sqlString(row.memberNo),
				sqlString(row.codeHash),
				row.graduationYear ?? "NULL",
				sqlString(row.name),
				sqlString(row.formerName),
				importedAt,
			].join(
				", ",
			)}) ON CONFLICT (member_no) DO UPDATE SET code_hash = excluded.code_hash, graduation_year = excluded.graduation_year, name = excluded.name, former_name = excluded.former_name, imported_at = excluded.imported_at;`,
	);
	return [...upserts, `DELETE FROM roster WHERE imported_at <> ${importedAt};`].join("\n");
}

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const csvPath = args.find(arg => !arg.startsWith("--"));
if (!csvPath) {
	console.error("使い方: bun run roster:import <CSV ファイル> [--remote | --check]");
	process.exit(1);
}

const text = readFileSync(csvPath, "utf8").replace(/^﻿/, "");
const { rows, errors } = toRosterRows(parseCsv(text));
if (errors.length > 0) {
	console.error(`CSV に問題があるため取り込みを中止しました（${errors.length} 件）`);
	for (const error of errors) {
		console.error(`  ${error}`);
	}
	process.exit(1);
}
if (rows.length === 0) {
	console.error("取り込める行がありません。");
	process.exit(1);
}
if (args.includes("--check")) {
	console.info(`問題ありません。${rows.length} 件を取り込めます（D1 には書き込んでいません）。`);
	process.exit(0);
}

// 名前を含むので、作業後に必ず消す
const dir = mkdtempSync(join(tmpdir(), "roster-"));
const sqlPath = join(dir, "roster.sql");
try {
	writeFileSync(sqlPath, toSql(rows, Date.now()), { mode: 0o600 });
	console.info(`${rows.length} 件を${remote ? "本番" : "ローカル"}の D1 に取り込みます。`);
	const proc = Bun.spawnSync(
		[
			"bunx",
			"wrangler",
			"d1",
			"execute",
			"DB",
			remote ? "--remote" : "--local",
			`--file=${sqlPath}`,
		],
		{ cwd: join(import.meta.dir, ".."), stdio: ["inherit", "inherit", "inherit"] },
	);
	if (proc.exitCode !== 0) {
		process.exit(proc.exitCode ?? 1);
	}
} finally {
	rmSync(dir, { recursive: true, force: true });
}
