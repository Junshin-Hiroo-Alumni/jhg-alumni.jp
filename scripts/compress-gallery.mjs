// content/gallery 内の画像を Web 用に最適化し、レスポンシブ表示用の派生画像を生成する。
//
//   bun run compress:gallery
//
// 各画像について、複数の横幅 × 2フォーマット（AVIF / WebP）の派生画像と、
// 読み込み中に表示する極小のぼかしプレースホルダ（LQIP）を生成します。
//
//   001-480.webp  001-480.avif   ← グリッドのサムネ用（軽い）
//   001-1024.webp 001-1024.avif  ← タブレット / Retina 用
//   001-1920.webp 001-1920.avif  ← ライトボックス（拡大）用
//
// - 出力ファイル名は「追加した順（更新日時）」に 001, 002 ... と連番化します。
// - 既に派生画像が存在する番号はそのまま維持し、新しく追加した元画像が続きの番号になります。
// - 元画像（jpg/png/webp など）は派生画像を書き出したあとに削除します。
//   そのため再実行しても処理対象が無く、何度実行しても安全（冪等）です。
// - 内容が完全に同一の重複画像は 1 枚だけ残します。
// - 各画像の寸法・LQIP・生成済みの横幅は content/gallery-manifest.json に書き出し、
//   アプリ（lib/gallery.ts）がそれを読んで srcset / ぼかしプレースホルダを構築します。
//
// 実行には Node.js が必要です（`bun run compress:gallery` は内部で node を呼びます）。

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const GALLERY_DIR = path.resolve(__dirname, "../apps/web/app/content/gallery");
const MANIFEST_PATH = path.resolve(GALLERY_DIR, "..", "gallery-manifest.json");
// 旧バージョンが残した不要ファイル（あれば掃除する）
const LEGACY_FILES = [
	path.join(GALLERY_DIR, ".compress-manifest.json"),
	path.resolve(GALLERY_DIR, "..", "gallery-dimensions.json"),
];

// 生成する横幅。元画像幅より大きいものは生成しない（拡大はしない）。
// 480: グリッドのサムネ / 1024: タブレット・Retina / 1920: ライトボックス用の最大。
const TARGET_WIDTHS = [480, 1024, 1920];
const MAX_WIDTH = 1920; // これ以上には拡大しない上限
const WEBP_QUALITY = 80; // 0-100
const AVIF_QUALITY = 50; // AVIF は同画質でも数値を低めに取れる
const LQIP_WIDTH = 24; // ぼかしプレースホルダの横幅（極小）
const LQIP_QUALITY = 40;
const NUMBER_PADDING = 3; // 連番の桁数（001 ...）

const SOURCE_EXTENSIONS = new Set([
	".jpg",
	".jpeg",
	".png",
	".webp",
	".avif",
	".gif",
	".tiff",
	".tif",
]);

// 既に生成済みの派生画像（001-480.webp など）の判定
const VARIANT_RE = /^(\d{1,})-(\d{1,})\.(webp|avif)$/;

const sha256 = buffer => createHash("sha256").update(buffer).digest("hex");
const toKilobytes = bytes => `${(bytes / 1024).toFixed(0)}KB`;
const paddedId = n => String(n).padStart(NUMBER_PADDING, "0");

async function loadManifest() {
	if (!existsSync(MANIFEST_PATH)) return {};
	try {
		return JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
	} catch {
		return {};
	}
}

// 重複時に残す優先度: 追加が古い順 → 名前順。
function sourcePriority(a, b) {
	return a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name);
}

// 内容ハッシュが同一の元画像は重複。1枚だけ残し、残りはファイルごと削除する。
async function dedupeSources(sources) {
	const keptByHash = new Map();
	for (const it of sources) {
		const current = keptByHash.get(it.hash);
		if (!current || sourcePriority(it, current) < 0) keptByHash.set(it.hash, it);
	}
	const kept = new Set(keptByHash.values());
	let removed = 0;
	for (const it of sources) {
		if (kept.has(it)) continue;
		await unlink(path.join(GALLERY_DIR, it.name));
		console.info(`dup    ${it.name}  (= ${keptByHash.get(it.hash).name}) を重複として削除`);
		removed++;
	}
	return { kept: [...kept].sort(sourcePriority), duplicateCount: removed };
}

// 極小のぼかしプレースホルダ（data URI）を作る。読み込み中の白い隙間を防ぐ。
async function makeLqip(buffer) {
	const out = await sharp(buffer, { limitInputPixels: false })
		.rotate()
		.resize({ width: LQIP_WIDTH })
		.webp({ quality: LQIP_QUALITY })
		.toBuffer();
	return `data:image/webp;base64,${out.toString("base64")}`;
}

// 1枚の元画像から、各横幅 × (webp/avif) の派生画像と LQIP を生成する。
// 生成したファイルを書き出し、manifest エントリ（寸法・横幅・lqip）を返す。
async function renderVariants(id, buffer) {
	const base = sharp(buffer, { limitInputPixels: false }).rotate();
	const meta = await base.metadata();
	const originalWidth = meta.width ?? MAX_WIDTH;
	const originalHeight = meta.height ?? MAX_WIDTH;

	const cap = Math.min(originalWidth, MAX_WIDTH);
	const widths = [...new Set([...TARGET_WIDTHS.filter(w => w < cap), cap])].sort((a, b) => a - b);

	let writtenBytes = 0;
	for (const w of widths) {
		const resized = sharp(buffer, { limitInputPixels: false })
			.rotate()
			.resize({ width: w, withoutEnlargement: true });
		const [webp, avif] = await Promise.all([
			resized.clone().webp({ quality: WEBP_QUALITY }).toBuffer(),
			resized.clone().avif({ quality: AVIF_QUALITY }).toBuffer(),
		]);
		await Promise.all([
			writeFile(path.join(GALLERY_DIR, `${id}-${w}.webp`), webp),
			writeFile(path.join(GALLERY_DIR, `${id}-${w}.avif`), avif),
		]);
		writtenBytes += webp.length + avif.length;
	}

	const lqip = await makeLqip(buffer);
	const finalWidth = cap;
	const finalHeight = Math.round((originalHeight * cap) / originalWidth);
	return {
		entry: { width: finalWidth, height: finalHeight, widths, lqip },
		writtenBytes,
	};
}

async function main() {
	if (!existsSync(GALLERY_DIR)) {
		console.error(`ギャラリーフォルダが見つかりません: ${GALLERY_DIR}`);
		process.exitCode = 1;
		return;
	}

	const dirEntries = await readdir(GALLERY_DIR, { withFileTypes: true });

	// 既に生成済みの派生画像から、使用済みの番号を集める
	const existingIds = new Set();
	for (const entry of dirEntries) {
		if (!entry.isFile()) continue;
		const m = entry.name.match(VARIANT_RE);
		if (m) existingIds.add(m[1]);
	}

	// 元画像（未処理）を集める。派生画像・隠しファイルは除く。
	const sourceNames = dirEntries
		.filter(entry => {
			if (!entry.isFile() || entry.name.startsWith(".")) return false;
			if (VARIANT_RE.test(entry.name)) return false;
			return SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
		})
		.map(entry => entry.name);

	const sources = await Promise.all(
		sourceNames.map(async name => {
			const filePath = path.join(GALLERY_DIR, name);
			const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
			return { name, buffer, hash: sha256(buffer), mtimeMs: stats.mtimeMs };
		}),
	);

	const { kept: newSources, duplicateCount } = await dedupeSources(sources);

	const previousManifest = await loadManifest();
	const manifest = {};

	// 既存の番号は再生成せず、manifest 情報を引き継ぐ（無ければ最大幅の派生画像から復元）
	for (const id of [...existingIds].sort()) {
		if (previousManifest[id]) {
			manifest[id] = previousManifest[id];
			continue;
		}
		const widthFiles = dirEntries
			.map(e => e.name.match(VARIANT_RE))
			.filter(m => m && m[1] === id && m[3] === "webp")
			.map(m => Number.parseInt(m[2], 10))
			.sort((a, b) => a - b);
		if (widthFiles.length === 0) continue;
		const largest = `${id}-${widthFiles[widthFiles.length - 1]}.webp`;
		const buffer = await readFile(path.join(GALLERY_DIR, largest));
		const meta = await sharp(buffer).metadata();
		manifest[id] = {
			width: meta.width,
			height: meta.height,
			widths: widthFiles,
			lqip: await makeLqip(buffer),
		};
	}

	// 新しい元画像に続き番号を割り当てて派生画像を生成する
	let nextNumber =
		[...existingIds].reduce((max, id) => Math.max(max, Number.parseInt(id, 10)), 0) + 1;

	let renderedCount = 0;
	for (const src of newSources) {
		const id = paddedId(nextNumber);
		const { entry, writtenBytes } = await renderVariants(id, src.buffer);
		manifest[id] = entry;
		await unlink(path.join(GALLERY_DIR, src.name)); // 元画像を削除
		console.info(
			`done   ${src.name} -> ${id}-*  [${entry.widths.join(", ")}] ${toKilobytes(src.buffer.length)} -> ${toKilobytes(writtenBytes)}`,
		);
		nextNumber++;
		renderedCount++;
	}

	// 番号順に整列して manifest を書き出す
	const sorted = Object.fromEntries(
		Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
	);
	await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);

	// 旧バージョンの不要ファイルを掃除する
	for (const file of LEGACY_FILES) {
		if (existsSync(file)) await unlink(file);
	}

	console.info(
		`\n完了: 生成 ${renderedCount} 件 / 既存維持 ${existingIds.size} 件 / 重複削除 ${duplicateCount} 件 / 画像数 ${Object.keys(sorted).length}`,
	);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
