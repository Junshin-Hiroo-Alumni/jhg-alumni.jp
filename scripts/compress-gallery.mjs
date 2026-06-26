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
async function renderVariants(id, buffer, outDir = GALLERY_DIR) {
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
			writeFile(path.join(outDir, `${id}-${w}.webp`), webp),
			writeFile(path.join(outDir, `${id}-${w}.avif`), avif),
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

// 1. ルートディレクトリ内の既存派生画像IDを収集
function collectRootExistingIds(dirEntries) {
	const existingIds = new Set();
	for (const entry of dirEntries) {
		if (!entry.isFile()) continue;
		const m = entry.name.match(VARIANT_RE);
		if (m) existingIds.add(m[1]);
	}
	return existingIds;
}

// 2. ルートディレクトリ内の未処理元画像を集める
async function collectRootSources(dirEntries) {
	const sourceNames = dirEntries
		.filter(entry => {
			if (!entry.isFile() || entry.name.startsWith(".")) return false;
			if (VARIANT_RE.test(entry.name)) return false;
			return SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
		})
		.map(entry => entry.name);

	return Promise.all(
		sourceNames.map(async name => {
			const filePath = path.join(GALLERY_DIR, name);
			const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
			return { name, buffer, hash: sha256(buffer), mtimeMs: stats.mtimeMs };
		}),
	);
}

// 3. ルートディレクトリの既存マニフェスト復元
async function restoreRootManifest(dirEntries, existingIds, previousManifest, manifest) {
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
}

// 4. 新しいルート画像の処理
async function processRootNewImages(newSources, existingIds, manifest) {
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
	return renderedCount;
}

// 5.1 単一のグループの処理
async function processSingleGroup(groupId, previousManifest, manifest) {
	const groupDir = path.join(GALLERY_DIR, groupId);
	const groupEntries = await readdir(groupDir, { withFileTypes: true });

	// グループフォルダ内の既存派生画像から使用済みローカル番号を収集
	const existingLocalIds = new Set();
	for (const entry of groupEntries) {
		if (!entry.isFile()) continue;
		const m = entry.name.match(VARIANT_RE);
		if (m) existingLocalIds.add(m[1]);
	}

	// 既存分は manifest に引き継ぎ
	for (const localId of [...existingLocalIds].sort()) {
		const manifestKey = `${groupId}/${localId}`;
		if (previousManifest[manifestKey]) {
			manifest[manifestKey] = previousManifest[manifestKey];
			continue;
		}
		const widthFiles = groupEntries
			.map(e => e.name.match(VARIANT_RE))
			.filter(m => m && m[1] === localId && m[3] === "webp")
			.map(m => Number.parseInt(m[2], 10))
			.sort((a, b) => a - b);
		if (widthFiles.length === 0) continue;
		const largest = `${localId}-${widthFiles[widthFiles.length - 1]}.webp`;
		const buffer = await readFile(path.join(groupDir, largest));
		const meta = await sharp(buffer).metadata();
		manifest[manifestKey] = {
			width: meta.width,
			height: meta.height,
			widths: widthFiles,
			lqip: await makeLqip(buffer),
		};
		console.info(`rebuild  ${manifestKey}`);
	}

	// 新しい元画像をグループ内連番で処理し保存
	const groupSourceNames = groupEntries
		.filter(e => {
			if (!e.isFile() || e.name.startsWith(".") || e.name === "index.md") return false;
			if (VARIANT_RE.test(e.name)) return false;
			return SOURCE_EXTENSIONS.has(path.extname(e.name).toLowerCase());
		})
		.map(e => e.name);

	if (groupSourceNames.length === 0) return 0;

	const groupSources = await Promise.all(
		groupSourceNames.map(async name => {
			const filePath = path.join(groupDir, name);
			const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
			return { name, buffer, hash: sha256(buffer), mtimeMs: stats.mtimeMs };
		}),
	);

	let groupNextNumber =
		[...existingLocalIds].reduce((max, id) => Math.max(max, Number.parseInt(id, 10)), 0) + 1;

	let renderedCount = 0;
	for (const src of [...groupSources].sort(sourcePriority)) {
		const localId = paddedId(groupNextNumber);
		const manifestKey = `${groupId}/${localId}`;
		const { entry, writtenBytes } = await renderVariants(localId, src.buffer, groupDir);
		manifest[manifestKey] = entry;
		await unlink(path.join(groupDir, src.name));
		console.info(
			`done   ${groupId}/${src.name} -> ${manifestKey}-*  [${entry.widths.join(", ")}] ${toKilobytes(src.buffer.length)} -> ${toKilobytes(writtenBytes)}`,
		);
		groupNextNumber++;
		renderedCount++;
	}
	return renderedCount;
}

// 5. サブフォルダ（グループ）の処理
async function processGroups(dirEntries, previousManifest, manifest) {
	const subdirs = dirEntries
		.filter(e => e.isDirectory() && !e.name.startsWith("."))
		.map(e => e.name)
		.sort();

	let renderedCount = 0;
	for (const groupId of subdirs) {
		renderedCount += await processSingleGroup(groupId, previousManifest, manifest);
	}
	return renderedCount;
}

async function main() {
	if (!existsSync(GALLERY_DIR)) {
		console.error(`ギャラリーフォルダが見つかりません: ${GALLERY_DIR}`);
		process.exitCode = 1;
		return;
	}

	const dirEntries = await readdir(GALLERY_DIR, { withFileTypes: true });

	// 既存IDと新規元画像の収集
	const existingIds = collectRootExistingIds(dirEntries);
	const sources = await collectRootSources(dirEntries);
	const { kept: newSources, duplicateCount } = await dedupeSources(sources);

	const previousManifest = await loadManifest();
	const manifest = {};

	// ルート既存分のマニフェスト復元・引き継ぎ
	await restoreRootManifest(dirEntries, existingIds, previousManifest, manifest);

	// 新しいルート画像の処理
	let renderedCount = await processRootNewImages(newSources, existingIds, manifest);

	// サブフォルダ（グループ）内の画像を処理する
	const groupRenderedCount = await processGroups(dirEntries, previousManifest, manifest);
	renderedCount += groupRenderedCount;

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
