//   アプリ（lib/gallery.ts）がそれを読んで srcset / ぼかしプレースホルダを構築します。
//
// 実行には Node.js が必要です（`bun run compress:gallery` は内部で node を呼びます）。

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, stat, unlink, writeFile } from "node:fs/promises";
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

// 派生画像（001-480.webp など）の判定
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
async function renderVariants(
	id,
	buffer,
	outDir = path.join(GALLERY_DIR, "dist"),
	srcName = "",
	srcHash = "",
) {
	// 出力先フォルダ（dist）を自動作成
	if (!existsSync(outDir)) {
		await mkdir(outDir, { recursive: true });
	}

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
		entry: { width: finalWidth, height: finalHeight, widths, lqip, srcName, srcHash },
		writtenBytes,
	};
}

// 5.1 元画像の収集とハッシュ計算
async function collectSources(albumDir) {
	const dirEntries = await readdir(albumDir, { withFileTypes: true });
	const sourceNames = dirEntries
		.filter(entry => {
			if (!entry.isFile() || entry.name.startsWith(".")) return false;
			if (entry.name === "index.md") return false;
			if (VARIANT_RE.test(entry.name)) return false;
			return SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase());
		})
		.map(entry => entry.name);

	return Promise.all(
		sourceNames.map(async name => {
			const filePath = path.join(albumDir, name);
			const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
			return { name, buffer, hash: sha256(buffer), mtimeMs: stats.mtimeMs };
		}),
	);
}

// 5.2 重複元画像の排除
async function dedupeGroupSources(albumDir, sources, groupId) {
	const keptByHash = new Map();
	for (const it of sources) {
		const current = keptByHash.get(it.hash);
		if (!current || sourcePriority(it, current) < 0) keptByHash.set(it.hash, it);
	}
	const newSources = [...keptByHash.values()].sort(sourcePriority);

	for (const it of sources) {
		if (keptByHash.get(it.hash) === it) continue;
		await unlink(path.join(albumDir, it.name));
		console.info(
			`dup    ${groupId ? `${groupId}/` : ""}${it.name} (= ${keptByHash.get(it.hash).name}) を重複として削除`,
		);
	}
	return newSources;
}

// 5.3 キャッシュヒットエントリの検出
function findCacheHits(newSources, groupPrevEntries, groupId, manifest) {
	const cacheHitLocalIds = new Set();
	const activeManifestKeys = new Set();

	for (const [key, prevEntry] of groupPrevEntries) {
		const localId = groupId ? key.split("/")[1] : key;
		const matchingSource = newSources.find(
			s => s.name === prevEntry.srcName && s.hash === prevEntry.srcHash,
		);

		if (matchingSource) {
			manifest[key] = prevEntry;
			cacheHitLocalIds.add(localId);
			activeManifestKeys.add(key);
			matchingSource.processed = true;
		}
	}
	return { cacheHitLocalIds, activeManifestKeys };
}

// 5.4 削除された派生画像の物理削除（クリーンアップ）
async function pruneDeletedImages(distDir, groupPrevEntries, activeManifestKeys, groupId) {
	for (const [key, prevEntry] of groupPrevEntries) {
		if (activeManifestKeys.has(key)) continue;

		const localId = groupId ? key.split("/")[1] : key;
		if (existsSync(distDir)) {
			const files = await readdir(distDir);
			for (const file of files) {
				if (file.startsWith(`${localId}-`)) {
					await unlink(path.join(distDir, file));
				}
			}
		}
		console.info(
			`prune  ${key} (元画像 ${prevEntry.srcName || "不明"} の削除によるクリーンアップ)`,
		);
	}
}

// 5.5 新規・更新画像のレンダリング
async function renderNewImages(unprocessedSources, cacheHitLocalIds, groupId, distDir, manifest) {
	let renderedCount = 0;
	if (unprocessedSources.length === 0) return renderedCount;

	const maxLocalId = [...cacheHitLocalIds].reduce(
		(max, id) => Math.max(max, Number.parseInt(id, 10)),
		0,
	);
	let nextNumber = maxLocalId + 1;

	for (const src of unprocessedSources) {
		const localId = paddedId(nextNumber);
		const manifestKey = groupId ? `${groupId}/${localId}` : localId;

		const { entry, writtenBytes } = await renderVariants(
			localId,
			src.buffer,
			distDir,
			src.name,
			src.hash,
		);
		manifest[manifestKey] = entry;

		console.info(
			`done   ${groupId ? `${groupId}/` : ""}${src.name} -> ${groupId ? `${groupId}/` : ""}dist/${localId}-*  [${entry.widths.join(", ")}] ${toKilobytes(src.buffer.length)} -> ${toKilobytes(writtenBytes)}`,
		);
		nextNumber++;
		renderedCount++;
	}
	return renderedCount;
}

// 5. アルバム（フォルダ）単位で増分ビルドとクリーンアップを行う共通関数
async function processAlbumImages({ groupId, albumDir, distDir, previousManifest, manifest }) {
	// 1. 元画像の収集と重複排除
	const sources = await collectSources(albumDir);
	const newSources = await dedupeGroupSources(albumDir, sources, groupId);

	// グループに属する以前のマニフェストを抽出
	const groupPrevEntries = Object.entries(previousManifest).filter(([key]) => {
		if (groupId) return key.startsWith(`${groupId}/`);
		return !key.includes("/");
	});

	// 2. キャッシュ判定
	const { cacheHitLocalIds, activeManifestKeys } = findCacheHits(
		newSources,
		groupPrevEntries,
		groupId,
		manifest,
	);

	// 3. クリーンアップ
	await pruneDeletedImages(distDir, groupPrevEntries, activeManifestKeys, groupId);

	// 4. 新規レンダリング
	const unprocessedSources = newSources.filter(s => !s.processed);
	const renderedCount = await renderNewImages(
		unprocessedSources,
		cacheHitLocalIds,
		groupId,
		distDir,
		manifest,
	);

	return renderedCount;
}

async function main() {
	if (!existsSync(GALLERY_DIR)) {
		console.error(`ギャラリーフォルダが見つかりません: ${GALLERY_DIR}`);
		process.exitCode = 1;
		return;
	}

	const dirEntries = await readdir(GALLERY_DIR, { withFileTypes: true });

	const previousManifest = await loadManifest();
	const manifest = {};

	// 1. ルート直下の画像の処理
	let renderedCount = await processAlbumImages({
		groupId: null,
		albumDir: GALLERY_DIR,
		distDir: path.join(GALLERY_DIR, "dist"),
		previousManifest,
		manifest,
	});

	// 2. サブフォルダ（グループ）の処理
	const subdirs = dirEntries
		.filter(e => e.isDirectory() && !e.name.startsWith("."))
		.map(e => e.name)
		.sort();

	for (const groupId of subdirs) {
		const groupRendered = await processAlbumImages({
			groupId,
			albumDir: path.join(GALLERY_DIR, groupId),
			distDir: path.join(GALLERY_DIR, groupId, "dist"),
			previousManifest,
			manifest,
		});
		renderedCount += groupRendered;
	}

	// 3. 番号順に整列して manifest を書き出す
	const sorted = Object.fromEntries(
		Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)),
	);
	await writeFile(MANIFEST_PATH, `${JSON.stringify(sorted, null, 2)}\n`);

	// 4. 旧バージョンの不要ファイルを掃除する
	for (const file of LEGACY_FILES) {
		if (existsSync(file)) await unlink(file);
	}

	console.info(
		`\n完了: 新規生成/更新 ${renderedCount} 件 / 画像総数 ${Object.keys(sorted).length}`,
	);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
