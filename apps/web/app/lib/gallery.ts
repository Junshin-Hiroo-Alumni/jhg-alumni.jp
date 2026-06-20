// app/content/gallery/ に画像を置き `bun run compress:gallery` を実行すると、
// 各画像の「複数解像度 × AVIF/WebP」派生画像と、ぼかしプレースホルダ（LQIP）が生成される。
// このモジュールはそれらをまとめ、レスポンシブ表示用の srcset を組み立てて返す。
//
// - 生成済みファイル名: 001-480.webp / 001-480.avif / 001-1024.webp ... （番号-横幅.拡張子）
// - 各画像のメタ情報（寸法・横幅・lqip）は content/gallery-manifest.json から読む。
// - 表示順は番号の昇順。

import manifest from "../content/gallery-manifest.json";

type ImageMeta = {
	width: number;
	height: number;
	widths: number[]; // 生成済みの横幅（昇順）
	lqip: string; // 読み込み中に表示する極小ぼかし画像（data URI）
};

// Vite に派生画像を取り込ませ、ハッシュ付きの配信 URL を得る
const files = import.meta.glob("../content/gallery/*-*.{webp,avif}", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

const urlByName: Record<string, string> = {};
for (const [filePath, url] of Object.entries(files)) {
	const name = filePath.split("/").pop();
	if (name) urlByName[name] = url;
}

const srcSet = (id: string, widths: number[], ext: "webp" | "avif"): string =>
	widths
		.map(w => urlByName[`${id}-${w}.${ext}`] && `${urlByName[`${id}-${w}.${ext}`]} ${w}w`)
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
			fallbackSrc: urlByName[`${id}-${widths[0]}.webp`],
			fullAvifSrcSet: urlByName[`${id}-${largest}.avif`]
				? `${urlByName[`${id}-${largest}.avif`]} ${largest}w`
				: "",
			fullWebpSrc: urlByName[`${id}-${largest}.webp`],
		};
	});

/** ギャラリーの全画像（番号昇順） */
export function getGalleryImages(): GalleryImage[] {
	return allImages;
}
