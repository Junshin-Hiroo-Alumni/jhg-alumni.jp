import { cloneElement, type ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router";
import { Light as SyntaxHighlighter } from "react-syntax-highlighter";
import bash from "react-syntax-highlighter/dist/esm/languages/hljs/bash";
import css_ from "react-syntax-highlighter/dist/esm/languages/hljs/css";
import javascript from "react-syntax-highlighter/dist/esm/languages/hljs/javascript";
import json from "react-syntax-highlighter/dist/esm/languages/hljs/json";
import markdownLang from "react-syntax-highlighter/dist/esm/languages/hljs/markdown";
import python from "react-syntax-highlighter/dist/esm/languages/hljs/python";
import typescript from "react-syntax-highlighter/dist/esm/languages/hljs/typescript";
import xml from "react-syntax-highlighter/dist/esm/languages/hljs/xml";
import { githubGist } from "react-syntax-highlighter/dist/esm/styles/hljs";
import { css } from "styled-system/css";
import { getNoticeBySlug } from "~/lib/notice";
import { buildMeta } from "~/lib/seo";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("css", css_);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("html", xml);
SyntaxHighlighter.registerLanguage("markdown", markdownLang);
SyntaxHighlighter.registerLanguage("md", markdownLang);

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

// ──────────────────────────────────────────────
// カスタム Markdown コンポーネント
// ──────────────────────────────────────────────

/**
 * <pre> タグのカスタムレンダラー。
 * react-markdown は <pre><code> の形で出力するため、
 * children（= <code>）に data-block 属性を追加して
 * コードブロックかどうかを CodeBlock 側で識別できるようにする。
 */
function Pre({ children }: ComponentPropsWithoutRef<"pre">) {
	if (children && typeof children === "object" && "props" in children) {
		const child = children as React.ReactElement<Record<string, unknown>>;
		return <>{cloneElement(child, { "data-block": true })}</>;
	}
	return <pre>{children}</pre>;
}

/**
 * <code> タグのカスタムレンダラー。
 * data-block が付いていればコードブロック、なければインラインコードとして扱う。
 */
function CodeBlock({ children, className, ...rest }: ComponentPropsWithoutRef<"code">) {
	const match = /language-(\w+)/.exec(className ?? "");
	const language = match?.[1];
	const isBlock = "data-block" in rest;

	if (isBlock && language) {
		return (
			<SyntaxHighlighter
				language={language}
				style={githubGist}
				customStyle={{
					borderRadius: "8px",
					fontSize: "0.875rem",
					lineHeight: "1.7",
					margin: "1.5rem 0",
					padding: "1.25rem 1.5rem",
					border: "1px solid #e5e7eb",
					backgroundColor: "#f9fafb",
				}}
				PreTag="div"
			>
				{String(children).replace(/\n$/, "")}
			</SyntaxHighlighter>
		);
	}

	if (isBlock) {
		// 言語指定なしのコードブロック
		return (
			<pre
				className={css({
					bg: "#f9fafb",
					border: "1px solid token(colors.gray.200)",
					borderRadius: "8px",
					p: "1.25rem 1.5rem",
					my: "1.5rem",
					overflowX: "auto",
					fontSize: "0.875rem",
					lineHeight: "1.7",
					fontFamily: "'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
				})}
			>
				<code>{children}</code>
			</pre>
		);
	}

	// インラインコード
	return (
		<code
			className={css({
				bg: "#f3f4f6",
				color: "#1f6c4a",
				borderRadius: "4px",
				px: "0.35em",
				py: "0.1em",
				fontSize: "0.875em",
				fontFamily: "'SFMono-Regular', 'Consolas', 'Liberation Mono', 'Menlo', monospace",
			})}
		>
			{children}
		</code>
	);
}

/** <blockquote> のカスタムレンダラー。左ボーダー付きのインデントスタイル。 */
function Blockquote({ children }: ComponentPropsWithoutRef<"blockquote">) {
	return (
		<blockquote
			className={css({
				borderLeft: "4px solid token(colors.green.400)",
				pl: "1.25rem",
				ml: "0",
				my: "1.5rem",
				color: "#666666",
				fontStyle: "italic",
				"& p": { my: "0.25rem" },
			})}
		>
			{children}
		</blockquote>
	);
}

const markdownComponents = {
	pre: Pre,
	code: CodeBlock,
	blockquote: Blockquote,
};

// ──────────────────────────────────────────────
// Route exports
// ──────────────────────────────────────────────

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
				<ReactMarkdown components={markdownComponents}>{news.body}</ReactMarkdown>
			</div>
		</div>
	);
}
