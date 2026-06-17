import { css, cx } from "styled-system/css";
import { officers } from "~/content/officers";
import { buildMeta } from "~/lib/seo";

const photoBaseClass = css({
	width: "100%",
	maxW: "200px",
	mx: "auto",
	aspectRatio: "1 / 1",
	borderRadius: "9999px",
	overflow: "hidden",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
});

const photoPlaceholderClass = css({
	bg: "green.100",
	color: "green.500",
	fontSize: "sm",
	fontWeight: "bold",
	border: "2px dashed token(colors.green.300)",
});

const photoImageClass = css({
	width: "100%",
	height: "100%",
	objectFit: "cover",
});

export function meta() {
	return buildMeta({
		title: "役員会",
		path: "/board-meeting",
		description: "順心広尾学園同窓会の役員会メンバーをご紹介します。",
	});
}

export default function BoardMeeting() {
	return (
		<div
			className={css({
				maxW: "1080px",
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
				役員会
			</h1>
			<div
				className={css({
					width: "44px",
					height: "3px",
					bg: "green.400",
					borderRadius: "9999px",
					mb: { base: "1.5rem", md: "2rem" },
				})}
			/>

			{/* TODO: 役員会の紹介文を差し替え */}
			<p
				className={css({
					maxW: "720px",
					color: "#444444",
					lineHeight: "2",
					fontSize: { base: "0.95rem", md: "1rem" },
					mb: { base: "2.5rem", md: "3.5rem" },
				})}
			>
				役員会は同窓会の執行機関です。2026年度は以下のメンバーで構成されています。
			</p>

			<div
				className={css({
					display: "grid",
					gridTemplateColumns: {
						base: "repeat(2, 1fr)",
						sm: "repeat(3, 1fr)",
						lg: "repeat(4, 1fr)",
					},
					gap: { base: "1.5rem 1rem", md: "2.5rem 1.5rem" },
				})}
			>
				{officers.map(officer => (
					<div key={officer.id} className={css({ textAlign: "center" })}>
						<div className={cx(photoBaseClass, !officer.image && photoPlaceholderClass)}>
							{officer.image ? (
								<img src={officer.image} alt={officer.name} className={photoImageClass} />
							) : (
								<span>写真</span>
							)}
						</div>

						<p
							className={css({
								mt: "1rem",
								color: "green.500",
								fontSize: "xs",
								fontWeight: "bold",
							})}
						>
							{officer.role}
						</p>
						<p
							className={css({
								mt: "0.25rem",
								color: "#222222",
								fontWeight: "bold",
								fontSize: "1.05rem",
							})}
						>
							{officer.name}
						</p>
						<p
							className={css({
								mt: "0.5rem",
								color: "#666666",
								fontSize: "sm",
								lineHeight: "1.7",
							})}
						>
							{officer.comment}
						</p>
					</div>
				))}
			</div>
		</div>
	);
}
