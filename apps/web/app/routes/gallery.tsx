import { css } from "styled-system/css";
import GalleryGrid from "~/components/gallery/GalleryGrid";
import GalleryGroupCard from "~/components/gallery/GalleryGroupCard";
import { getGalleryGroups, getGalleryImages } from "~/lib/gallery";
import { buildMeta } from "~/lib/seo";

export function meta() {
	return buildMeta({
		title: "フォトギャラリー",
		path: "/gallery",
		description:
			"順心広尾学園同窓会のフォトギャラリー。総会や行事など、同窓会活動の写真をアルバム形式で掲載しています。",
	});
}

export default function Gallery() {
	const groups = getGalleryGroups();
	const allImages = getGalleryImages();

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
			{/* ── ページヘッダー ───────────────────────────────────── */}
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
					mb: { base: "0.75rem", md: "1rem" },
				})}
			/>
			<p
				className={css({
					color: "#666",
					fontSize: { base: "0.9rem", md: "0.95rem" },
					lineHeight: "1.8",
					mb: { base: "2.5rem", md: "3rem" },
					maxW: "640px",
				})}
			>
				同窓会の活動をアルバムごとにまとめています。
			</p>

			{groups.length > 0 ? (
				<div
					className={css({
						display: "grid",
						gridTemplateColumns: {
							base: "1fr 1fr",
							md: "repeat(3, 1fr)",
						},
						gap: { base: "1.5rem 2.5rem", md: "2rem 4.5rem" },
					})}
				>
					{groups.map((group, i) => (
						<GalleryGroupCard key={group.id} group={group} index={i} animationDelay={i * 0.07} />
					))}
				</div>
			) : allImages.length === 0 ? (
				<p className={css({ color: "#666666", lineHeight: "2" })}>
					まだ写真がありません。
					<br />
					<code
						className={css({
							bg: "green.100",
							px: "0.4rem",
							borderRadius: "0.25rem",
						})}
					>
						apps/web/app/content/gallery/
					</code>{" "}
					にサブフォルダを作り、index.md と画像を追加してください。
				</p>
			) : (
				<GalleryGrid images={allImages} />
			)}
		</div>
	);
}
