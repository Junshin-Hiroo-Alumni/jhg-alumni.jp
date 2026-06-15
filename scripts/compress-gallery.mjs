// content/gallery 内の画像を Web 用に圧縮し、追加順の連番（001.webp ...）にリネームする。
//
//   bun run compress:gallery
//
// - sharp で webp に変換し、横幅を最大 1920px に調整します（拡大はしません）。
// - 既に圧縮済みの画像（内容ハッシュがマニフェストと一致）は再圧縮しません。
// - ファイル名は「追加した順（更新日時）」に 001.webp, 002.webp ... と連番化します。
//   既に連番済み＆圧縮済みの画像は番号を維持し、新しく追加した画像が続きの番号になります。
// - JPEG/PNG など webp 以外は webp へ変換し、元ファイルを削除します。
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
const MANIFEST_PATH = path.join(GALLERY_DIR, ".compress-manifest.json");

const MAX_WIDTH = 1920; // Web 表示用の最大横幅
const WEBP_QUALITY = 80; // 0-100。80 前後が画質/容量のバランス良好
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

const sha256 = buffer => createHash("sha256").update(buffer).digest("hex");
const toKilobytes = bytes => `${(bytes / 1024).toFixed(0)}KB`;
const isSequentialName = name => /^\d+\.webp$/.test(name);
const sequenceNumber = name => Number.parseInt(name, 10);
const sequentialName = n => `${String(n).padStart(NUMBER_PADDING, "0")}.webp`;

async function loadManifest() {
	if (!existsSync(MANIFEST_PATH)) return {};
	try {
		return JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
	} catch {
		return {};
	}
}

async function main() {
	if (!existsSync(GALLERY_DIR)) {
		console.error(`ギャラリーフォルダが見つかりません: ${GALLERY_DIR}`);
		process.exitCode = 1;
		return;
	}

	const dirEntries = await readdir(GALLERY_DIR, { withFileTypes: true });
	const names = dirEntries
		.filter(
			entry =>
				entry.isFile() &&
				!entry.name.startsWith(".") &&
				SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
		)
		.map(entry => entry.name);

	if (names.length === 0) {
		console.info(`対象画像がありません: ${GALLERY_DIR}`);
		return;
	}

	const previousManifest = await loadManifest();
	const knownHashes = new Set(Object.values(previousManifest));

	// 全ファイルを読み込み、内容ハッシュと更新日時（=追加順の判定）を求める
	const items = await Promise.all(
		names.map(async name => {
			const filePath = path.join(GALLERY_DIR, name);
			const [buffer, stats] = await Promise.all([readFile(filePath), stat(filePath)]);
			return { name, buffer, hash: sha256(buffer), mtimeMs: stats.mtimeMs };
		}),
	);

	// 既に「連番済み＆圧縮済み」のものは番号を維持してスキップ、それ以外は採番対象
	const settled = items.filter(it => isSequentialName(it.name) && knownHashes.has(it.hash));
	const pending = items
		.filter(it => !(isSequentialName(it.name) && knownHashes.has(it.hash)))
		.sort((a, b) => a.mtimeMs - b.mtimeMs || a.name.localeCompare(b.name));

	let nextNumber = settled.reduce((max, it) => Math.max(max, sequenceNumber(it.name)), 0) + 1;

	// 出力計画を作成（圧縮はここで実行。既圧縮の内容はそのまま使う）
	const plan = [];
	let compressedCount = 0;
	for (const it of pending) {
		let outputBuffer;
		let didCompress = false;
		if (knownHashes.has(it.hash)) {
			outputBuffer = it.buffer; // 既に圧縮済み（リネームのみ）
		} else {
			outputBuffer = await sharp(it.buffer, { limitInputPixels: false })
				.rotate()
				.resize({ width: MAX_WIDTH, withoutEnlargement: true })
				.webp({ quality: WEBP_QUALITY })
				.toBuffer();
			didCompress = true;
			compressedCount++;
		}
		plan.push({ from: it, outputName: sequentialName(nextNumber), outputBuffer, didCompress });
		nextNumber++;
	}

	// マニフェスト（最終状態）を組み立てつつ書き出し
	const manifest = {};
	for (const it of settled) manifest[it.name] = it.hash;

	const targetNames = new Set(plan.map(p => p.outputName));
	for (const { from, outputName, outputBuffer, didCompress } of plan) {
		await writeFile(path.join(GALLERY_DIR, outputName), outputBuffer);
		manifest[outputName] = sha256(outputBuffer);
		// 元ファイルを削除（ただし他の出力先と同名なら消さない）
		if (from.name !== outputName && !targetNames.has(from.name)) {
			await unlink(path.join(GALLERY_DIR, from.name));
		}
		if (didCompress) {
			console.info(
				`done   ${from.name} -> ${outputName}  ${toKilobytes(from.buffer.length)} -> ${toKilobytes(outputBuffer.length)}`,
			);
		} else {
			console.info(`rename ${from.name} -> ${outputName}`);
		}
	}

	await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
	console.info(
		`\n完了: 圧縮 ${compressedCount} 件 / リネーム ${plan.length - compressedCount} 件 / スキップ ${settled.length} 件`,
	);
}

main().catch(error => {
	console.error(error);
	process.exitCode = 1;
});
