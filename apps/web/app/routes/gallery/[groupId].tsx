import { IconArrowLeft } from "@tabler/icons-react";
import { Link, useParams } from "react-router";
import { css } from "styled-system/css";
import GalleryGrid from "~/components/gallery/GalleryGrid";
import { getGalleryGroup } from "~/lib/gallery";
import { buildMeta } from "~/lib/seo";

export function meta({ params }: { params: Record<string, string | undefined> }) {
	const group = getGalleryGroup(params.groupId ?? "");
	return buildMeta({
		title: group ? `${group.title} — フォトギャラリー` : "フォトギャラリー",
		path: `/gallery/${params.groupId ?? ""}`,
		description:
			group?.description ||
			"順心広尾学園同窓会のフォトギャラリー。総会や行事など、同窓会活動の写真を掲載しています。",
	});
}

export default function GalleryGroupPage() {
	const { groupId } = useParams<{ groupId: string }>();
	const group = getGalleryGroup(groupId ?? "");

	if (!group) {
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
				<Link
					to="/gallery"
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "0.375rem",
						color: "green.500",
						fontSize: "0.9rem",
						fontWeight: "500",
						mb: "2rem",
						textDecoration: "none",
						_hover: { textDecoration: "underline" },
					})}
				>
					<IconArrowLeft size={16} />
					ギャラリートップへ
				</Link>
				<p className={css({ color: "#666", lineHeight: "2" })}>
					指定されたアルバムが見つかりませんでした。
				</p>
			</div>
		);
	}

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
			<Link
				to="/gallery"
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "0.375rem",
					color: "green.500",
					fontSize: "0.875rem",
					fontWeight: "500",
					mb: "1.75rem",
					textDecoration: "none",
					transition: "opacity 0.15s ease",
					_hover: { opacity: "0.75" },
				})}
			>
				<IconArrowLeft size={16} />
				ギャラリートップへ
			</Link>

			<h1
				className={css({
					fontSize: { base: "1.75rem", md: "2.25rem" },
					fontWeight: "bold",
					color: "#222222",
					mb: "0.5rem",
					lineHeight: "1.3",
				})}
			>
				{group.title}
			</h1>
			<div
				className={css({
					width: "44px",
					height: "3px",
					bg: "green.400",
					borderRadius: "9999px",
					mb: group.description ? "1.25rem" : "2.5rem",
				})}
			/>

			{group.description && (
				<p
					className={css({
						color: "#555",
						lineHeight: "1.9",
						mb: { base: "2rem", md: "2.75rem" },
						fontSize: { base: "0.9rem", md: "0.95rem" },
						maxW: "640px",
					})}
				>
					{group.description}
				</p>
			)}

			<GalleryGrid images={group.images} />
		</div>
	);
}
