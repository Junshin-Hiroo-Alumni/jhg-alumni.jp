// app/content/gallery/ に画像を置くだけでフォトギャラリーに表示される。
// ファイルを追加・削除するだけで反映され、バックエンド不要。
// 表示順はファイル名の昇順（例: 01-xxx.webp, 02-xxx.webp ...）。
// 対応拡張子: webp / jpg / jpeg / png / avif / gif

import dimensions from "../content/gallery-dimensions.json";

const images = import.meta.glob("../content/gallery/*.{webp,jpg,jpeg,png,avif,gif}", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

const dimensionMap = dimensions as Record<string, { width: number; height: number }>;

export type GalleryImage = {
	src: string;
	name: string; // ファイル名（alt のフォールバック・ソート用）
	width?: number; // 元画像の幅（img の width 属性 → アスペクト比確保用）
	height?: number; // 元画像の高さ
};

const allImages: GalleryImage[] = Object.entries(images)
	.map(([path, src]) => {
		const name = path.split("/").pop() ?? path;
		return { src, name, width: dimensionMap[name]?.width, height: dimensionMap[name]?.height };
	})
	.sort((a, b) => a.name.localeCompare(b.name));

/** ギャラリーの全画像（ファイル名昇順） */
export function getGalleryImages(): GalleryImage[] {
	return allImages;
}
