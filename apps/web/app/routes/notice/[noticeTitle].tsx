import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router";
import { css } from "styled-system/css";
import { getNoticeBySlug } from "~/lib/notice";
import { buildMeta } from "~/lib/seo";

const proseClass = css({
	color: "#444444",
	lineHeight: "2",
	fontSize: { base: "0.95rem", md: "1rem" },
	"& h2": {
		fontSize: "1.4rem",
		fontWeight: "bold",
		color: "#222222",
		mt: "2.5rem",
		mb: "1rem",
	},
	"& h3": {
		fontSize: "1.15rem",
		fontWeight: "bold",
		color: "#222222",
		mt: "2rem",
		mb: "0.75rem",
	},
	"& p": { my: "1rem" },
	"& ul": { pl: "1.5rem", my: "1rem", listStyleType: "disc" },
	"& ol": { pl: "1.5rem", my: "1rem", listStyleType: "decimal" },
	"& li": { my: "0.35rem" },
	"& a": { color: "green.500", textDecoration: "underline" },
	"& strong": { fontWeight: "bold", color: "#222222" },
});

export function meta({ params }: { params: { noticeTitle?: string } }) {
	const news = params.noticeTitle ? getNoticeBySlug(params.noticeTitle) : undefined;
	if (!news) {
		// 存在しないお知らせはインデックスさせない
		return buildMeta({ title: "お知らせ", path: "/notice", noindex: true });
	}
	// Markdown 本文から検索用の説明文（抜粋）を作る
	const description =
		news.body
			.replace(/```[\s\S]*?```/g, "")
			.replace(/!\[[^\]]*\]\([^)]*\)/g, "")
			.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
			.replace(/[#>*_`~]/g, "")
			.replace(/\s+/g, " ")
			.trim()
			.slice(0, 110) || undefined;
	return buildMeta({
		title: news.title,
		path: `/notice/${news.slug}`,
		description,
		type: "article",
	});
}

export default function NoticeDetail() {
	const { noticeTitle } = useParams();
	const news = noticeTitle ? getNoticeBySlug(noticeTitle) : undefined;

	const containerClass = css({
		maxW: "720px",
		mx: "auto",
		w: "full",
		px: { base: "1.5rem", md: "2rem" },
		pt: { base: "7rem", md: "9rem" },
		pb: { base: "4rem", md: "6rem" },
	});

	if (!news) {
		return (
			<div className={containerClass}>
				<p className={css({ color: "#666666", mb: "1.5rem" })}>お知らせが見つかりませんでした。</p>
				<Link to="/notice" className={css({ color: "green.500", fontWeight: "bold" })}>
					← お知らせ一覧へ
				</Link>
			</div>
		);
	}

	return (
		<div className={containerClass}>
			<Link
				to="/notice"
				className={css({
					display: "inline-block",
					mb: "1.5rem",
					fontSize: "sm",
					fontWeight: "bold",
					color: "#888888",
					textDecoration: "none",
					_hover: { color: "green.500" },
				})}
			>
				← お知らせ一覧
			</Link>

			<div className={css({ display: "flex", alignItems: "center", gap: "1rem", mb: "1rem" })}>
				<span className={css({ color: "#888888", fontSize: "sm" })}>{news.formattedDate}</span>
				<span
					className={css({
						fontSize: "xs",
						fontWeight: "bold",
						color: "green.500",
						bg: "green.100",
						borderRadius: "9999px",
						px: "0.75rem",
						py: "0.25rem",
					})}
				>
					{news.category}
				</span>
			</div>

			<h1
				className={css({
					fontSize: { base: "1.6rem", md: "2rem" },
					fontWeight: "bold",
					color: "#222222",
					lineHeight: "1.4",
					pb: "1.5rem",
					mb: "1.5rem",
					borderBottom: "1px solid token(colors.gray.100)",
				})}
			>
				{news.title}
			</h1>

			<div className={proseClass}>
				<ReactMarkdown>{news.body}</ReactMarkdown>
			</div>
		</div>
	);
}
