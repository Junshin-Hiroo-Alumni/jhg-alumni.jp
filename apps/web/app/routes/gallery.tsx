import { css } from "styled-system/css";
import GalleryGrid from "~/components/gallery/GalleryGrid";
import { getGalleryImages } from "~/lib/gallery";
import { buildMeta } from "~/lib/seo";

export function meta() {
	return buildMeta({
		title: "フォトギャラリー",
		path: "/gallery",
		description:
			"順心広尾学園同窓会のフォトギャラリー。総会や行事など、同窓会活動の写真を掲載しています。",
	});
}

export default function Gallery() {
	const images = getGalleryImages();

	return (
		<div
			className={css({
				maxW: "1100px",
				mx: "auto",
				w: "full",
				px: { base: "1.5rem", md: "2rem" },
				pt: { base: "7rem", md: "9rem" },
				pb: { base: "4rem", md: "6rem" },
			})}
		>
			<h1
				className={css({
					fontSize: { base: "1.75rem", md: "2.25rem" },
					fontWeight: "bold",
					color: "#222222",
					mb: "0.5rem",
				})}
			>
				フォトギャラリー
			</h1>
			<div
				className={css({
					width: "44px",
					height: "3px",
					bg: "green.400",
					borderRadius: "9999px",
					mb: { base: "2rem", md: "2.5rem" },
				})}
			/>

			{images.length === 0 ? (
				<p className={css({ color: "#666666", lineHeight: "2" })}>
					まだ写真がありません。
					<br />
					<code className={css({ bg: "green.100", px: "0.4rem", borderRadius: "0.25rem" })}>
						apps/web/app/content/gallery/
					</code>{" "}
					に画像（webp / jpg / png など）を追加すると、ここに表示されます。
				</p>
			) : (
				<GalleryGrid images={images} />
			)}
		</div>
	);
}
