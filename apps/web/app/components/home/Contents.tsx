import { Link } from "react-router";
import { css } from "styled-system/css";
import ImagePlaceholder from "~/components/ui/ImagePlaceholder";
import SectionHeading from "~/components/ui/SectionHeading";

type ContentItem = {
	id: string;
	title: string;
	description: string;
	to: string;
	image?: string; // public 配下のパス。未指定ならプレースホルダーを表示
};

const contents: ContentItem[] = [
	{
		id: "board",
		title: "役員会",
		// TODO: 説明文を差し替え
		description: "役員会の活動や報告をご覧いただけます。",
		to: "/board-meeting",
		image: "/site/home/meeting.svg",
	},
	{
		id: "rules",
		title: "会則",
		description: "同窓会の会則について掲載しています。",
		to: "/code",
		image: "/site/home/book.svg",
	},
	{
		id: "gallery",
		title: "フォトギャラリー",
		description: "行事やイベントの写真をご覧いただけます。",
		to: "/gallery",
		image: "/site/home/camera.svg",
	},
];

// 緑の背景ボックスはそのまま、中の画像（イラスト）は 80% に縮めて中央配置
const cardImageBoxClass = css({
	aspectRatio: "4 / 3",
	bg: "green.100",
	borderRadius: "1rem",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
});

const cardImageClass = css({
	width: "80%",
	height: "80%",
	objectFit: "contain",
	display: "block",
});

export default function Contents() {
	return (
		<section
			className={css({
				bg: "green.100",
				px: { base: "1.5rem", md: "2rem" },
				py: { base: "4rem", md: "6rem" },
			})}
		>
			<div className={css({ maxW: "1080px", mx: "auto", w: "full" })}>
				<SectionHeading eyebrow="CONTENTS" title="コンテンツ" />

				<div
					className={css({
						display: "grid",
						gridTemplateColumns: { base: "1fr", sm: "repeat(3, 1fr)" },
						gap: { base: "1.25rem", md: "1.75rem" },
					})}
				>
					{contents.map(item => (
						<Link
							key={item.id}
							to={item.to}
							className={css({
								display: "block",
								bg: "#ffffff",
								borderRadius: "1.25rem",
								overflow: "hidden",
								textDecoration: "none",
								boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
								transition: "transform 0.2s ease, box-shadow 0.2s ease",
								_hover: {
									transform: "translateY(-4px)",
									boxShadow: "0 12px 32px rgba(0, 0, 0, 0.1)",
								},
							})}
						>
							<div className={css({ p: "0.75rem" })}>
								{item.image ? (
									<div className={cardImageBoxClass}>
										<img src={item.image} alt="" loading="lazy" className={cardImageClass} />
									</div>
								) : (
									<ImagePlaceholder label={`${item.title} 画像`} aspectRatio="4 / 3" />
								)}
							</div>
							<div className={css({ px: "1.5rem", pb: "1.75rem", pt: "0.5rem" })}>
								<h3
									className={css({
										fontWeight: "bold",
										fontSize: "1.25rem",
										color: "#222222",
									})}
								>
									{item.title}
								</h3>
								<p
									className={css({
										mt: "0.5rem",
										color: "#666666",
										fontSize: "sm",
										lineHeight: "1.8",
									})}
								>
									{item.description}
								</p>
								<span
									className={css({
										display: "inline-block",
										mt: "1rem",
										color: "green.500",
										fontWeight: "bold",
										fontSize: "sm",
									})}
								>
									詳しく見る →
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
}
