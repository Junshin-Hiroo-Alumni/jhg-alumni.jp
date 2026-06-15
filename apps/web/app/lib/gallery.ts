// app/content/gallery/ に画像を置くだけでフォトギャラリーに表示される。
// ファイルを追加・削除するだけで反映され、バックエンド不要。
// 表示順はファイル名の昇順（例: 01-xxx.webp, 02-xxx.webp ...）。
// 対応拡張子: webp / jpg / jpeg / png / avif / gif

const images = import.meta.glob("../content/gallery/*.{webp,jpg,jpeg,png,avif,gif}", {
	eager: true,
	query: "?url",
	import: "default",
}) as Record<string, string>;

export type GalleryImage = {
	src: string;
	name: string; // ファイル名（alt のフォールバック・ソート用）
};

const allImages: GalleryImage[] = Object.entries(images)
	.map(([path, src]) => ({ src, name: path.split("/").pop() ?? path }))
	.sort((a, b) => a.name.localeCompare(b.name));

/** ギャラリーの全画像（ファイル名昇順） */
export function getGalleryImages(): GalleryImage[] {
	return allImages;
}
