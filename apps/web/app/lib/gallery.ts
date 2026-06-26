// app/content/gallery/ に画像を置き `bun run compress:gallery` を実行すると、
// 各画像の「複数解像度 × AVIF/WebP」派生画像と、ぼかしプレースホルダ（LQIP）が生成される。
// このモジュールはそれらをまとめ、レスポンシブ表示用の srcset を組み立てて返す。
//
// ── ファイル構成 ──
//   content/gallery/
//     001-480.webp  ... （ルート直下 = グループ未分類）
//     sokai-2024/
//       index.md        ← title / description / order のみ（imageIds 不要）
//       001-480.webp    ← compress:gallery で自動生成
//       001-480.avif
//       ...
//
// ── グループの作り方 ──
//   1. content/gallery/{任意のフォルダ名}/ を作る
//   2. index.md を置く（frontmatter に title / description / order）
//   3. フォルダに元画像（jpg/png など）を入れる
//   4. bun run compress:gallery を実行 → 派生画像が自動生成される
//
// ── manifest キーの形式 ──
//   "001"             → ルート直下（グループ未分類）
//   "sokai-2024/001"  → グループ sokai-2024 の 1 枚目

import manifest from "../content/gallery-manifest.json";

type ImageMeta = {
	width: number;
	height: number;
	widths: number[]; // 生成済みの横幅（昇順）
	lqip: string; // 読み込み中に表示する極小ぼかし画像（data URI）
};

// Vite にルートとサブフォルダ両方の派生画像を取り込ませる
const files = import.meta.glob("../content/gallery/**/*-*.{webp,avif}", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

// キーを "gallery ルートからの相対パス" にする
//   "../content/gallery/001-480.webp"          → "001-480.webp"
//   "../content/gallery/sokai-2024/001-480.webp" → "sokai-2024/001-480.webp"
const urlByKey: Record<string, string> = {};
for (const [filePath, url] of Object.entries(files)) {
	const m = filePath.match(/\/gallery\/(.+)$/);
	if (m) urlByKey[m[1]] = url;
}

// id は "001" または "sokai-2024/001" 形式
const srcSet = (id: string, widths: number[], ext: "webp" | "avif"): string =>
	widths
		.map(w => {
			const key = `${id}-${w}.${ext}`;
			return urlByKey[key] && `${urlByKey[key]} ${w}w`;
		})
		.filter(Boolean)
		.join(", ");

export type GalleryImage = {
	id: string;
	name: string; // ソート・key 用（= id）
	width: number; // アスペクト比確保用（img の width/height 属性）
	height: number;
	lqip: string; // 読み込み中のぼかしプレースホルダ
	avifSrcSet: string; // AVIF の srcset（優先）
	webpSrcSet: string; // WebP の srcset（フォールバック）
	fallbackSrc: string; // srcset 非対応時の src（最小の WebP）
	fullAvifSrcSet: string; // ライトボックス用（最大解像度の AVIF）
	fullWebpSrc: string; // ライトボックス用（最大解像度の WebP）
};

const meta = manifest as Record<string, ImageMeta>;

const allImages: GalleryImage[] = Object.entries(meta)
	.sort(([a], [b]) => a.localeCompare(b))
	.map(([id, info]) => {
		const widths = info.widths;
		const largest = widths[widths.length - 1];
		return {
			id,
			name: id,
			width: info.width,
			height: info.height,
			lqip: info.lqip,
			avifSrcSet: srcSet(id, widths, "avif"),
			webpSrcSet: srcSet(id, widths, "webp"),
			fallbackSrc: urlByKey[`${id}-${widths[0]}.webp`] ?? "",
			fullAvifSrcSet: urlByKey[`${id}-${largest}.avif`]
				? `${urlByKey[`${id}-${largest}.avif`]} ${largest}w`
				: "",
			fullWebpSrc: urlByKey[`${id}-${largest}.webp`] ?? "",
		};
	});

/** ギャラリーの全画像（番号昇順） */
export function getGalleryImages(): GalleryImage[] {
	return allImages;
}

// ── グループ（アルバム）──────────────────────────────────────────────────────

// content/gallery/*/index.md を読み込む（タイトル・説明文・表示順のみ定義）
const groupFiles = import.meta.glob("../content/gallery/*/index.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

/** frontmatter のみをパースして Record を返す */
function parseFrontmatter(raw: string): Record<string, string> {
	const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
	if (!match) return {};
	const data: Record<string, string> = {};
	for (const line of match[1].split(/\r?\n/)) {
		const idx = line.indexOf(":");
		if (idx === -1) continue;
		const key = line.slice(0, idx).trim();
		const value = line
			.slice(idx + 1)
			.trim()
			.replace(/^["']|["']$/g, "");
		if (key) data[key] = value;
	}
	return data;
}

/** "../content/gallery/sokai-2024/index.md" → "sokai-2024" */
function toGroupId(filePath: string): string {
	const parts = filePath.replace(/\\/g, "/").split("/");
	return parts[parts.length - 2];
}

export type GalleryGroup = {
	id: string;
	title: string;
	description: string;
	order: number;
	images: GalleryImage[];
	coverImage: GalleryImage | undefined;
};

const allGroups: GalleryGroup[] = Object.entries(groupFiles)
	.map(([filePath, raw]) => {
		const data = parseFrontmatter(raw);
		const id = toGroupId(filePath);
		// manifest キーが "{groupId}/" で始まる画像を抽出し、ローカル番号順に並べる
		const images = allImages
			.filter(img => img.id.startsWith(`${id}/`))
			.sort((a, b) => {
				const aNum = Number.parseInt(a.id.split("/")[1] ?? "0", 10);
				const bNum = Number.parseInt(b.id.split("/")[1] ?? "0", 10);
				return aNum - bNum;
			});
		return {
			id,
			title: data.title ?? "（無題）",
			description: data.description ?? "",
			order: Number.parseInt(data.order ?? "999", 10),
			images,
			coverImage: images[0],
		};
	})
	.filter(g => g.images.length > 0)
	.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));

/** グループ一覧（order 昇順） */
export function getGalleryGroups(): GalleryGroup[] {
	return allGroups;
}

/** ID でグループを 1 件取得 */
export function getGalleryGroup(id: string): GalleryGroup | undefined {
	return allGroups.find(g => g.id === id);
}
