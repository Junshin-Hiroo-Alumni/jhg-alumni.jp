import { IconBrandGithub } from "@tabler/icons-react";
import {
	Children,
	type ComponentPropsWithoutRef,
	isValidElement,
	type ReactElement,
	type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import { css } from "styled-system/css";
import { buildMeta } from "~/lib/seo";

const CODE_REPO_URL = "https://github.com/Junshin-Hiroo-Alumni/Code";

const files = import.meta.glob("../content/code.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const codeMarkdown = Object.values(files)[0] ?? "";

const proseClass = css({
	color: "#444444",
	lineHeight: "2",
	fontSize: { base: "0.95rem", md: "1rem" },
	"& h1": {
		fontSize: { base: "1.6rem", md: "2rem" },
		fontWeight: "bold",
		color: "#222222",
		mb: "1.5rem",
		lineHeight: "1.4",
	},
	"& h2": {
		fontSize: "1.35rem",
		fontWeight: "bold",
		color: "#222222",
		mt: "2.5rem",
		mb: "1rem",
		pb: "0.5rem",
		borderBottom: "1px solid token(colors.gray.100)",
	},
	"& h3": {
		fontSize: "1.15rem",
		fontWeight: "bold",
		color: "#222222",
		mt: "2rem",
		mb: "0.75rem",
	},
	"& p": { my: "1rem" },
	"& ul": { pl: "calc(1.5rem + 4.5em)", my: "1rem", listStyleType: "disc" },
	"& ol": { pl: "1.5rem", my: "1rem", listStyleType: "decimal" },
	"& li": { my: "0.35rem" },
	"& a": { color: "green.500", textDecoration: "underline" },
	"& strong": { fontWeight: "bold", color: "#222222" },
	"& blockquote": {
		borderLeft: "3px solid token(colors.green.400)",
		bg: "green.100",
		color: "#444444",
		px: "1.25rem",
		py: "0.75rem",
		borderRadius: "0.5rem",
		my: "1.5rem",
	},
	"& hr": {
		border: "none",
		borderTop: "1px solid token(colors.gray.100)",
		my: "2rem",
	},
});

const ARTICLE_NUMBER_PATTERN = /^第\d+条$/;

const articleClass = css({
	display: "flex",
	gap: "1em",
	// 条文番号の幅を揃え、続く箇条書き（& ul の pl）も本文の位置に合わせる。幅を変える場合は両方を更新する。
	"& > strong": { flexShrink: 0, minWidth: "3.5em" },
});

/** 「**第8条**　本文」の段落は、折り返した行が条文番号の右（本文の先頭）に揃うようにする。 */
function Paragraph({ children }: ComponentPropsWithoutRef<"p">) {
	const [head, ...rest] = Children.toArray(children);
	if (
		isValidElement(head) &&
		head.type === "strong" &&
		typeof (head as ReactElement<{ children?: ReactNode }>).props.children === "string" &&
		ARTICLE_NUMBER_PATTERN.test((head as ReactElement<{ children: string }>).props.children)
	) {
		const [first, ...others] = rest;
		const body = typeof first === "string" ? [first.replace(/^[\s　]+/, ""), ...others] : rest;
		return (
			<p className={articleClass}>
				{head}
				<span>{body}</span>
			</p>
		);
	}
	return <p>{children}</p>;
}

export function meta() {
	return buildMeta({
		title: "会則",
		path: "/code",
		description: "順心広尾学園同窓会の会則（規約）を掲載しています。",
	});
}

export default function Code() {
	return (
		<div
			className={css({
				maxW: "760px",
				mx: "auto",
				w: "full",
				px: { base: "1.5rem", md: "2rem" },
				pt: { base: "7rem", md: "9rem" },
				pb: { base: "4rem", md: "6rem" },
			})}
		>
			<div
				className={css({
					display: "flex",
					flexWrap: "wrap",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "1rem",
					mb: "1.5rem",
				})}
			>
				<h1
					className={css({
						whiteSpace: "nowrap",
						fontSize: "clamp(1.1rem, 6vw, 2rem)",
						fontWeight: "bold",
						color: "#222222",
						lineHeight: "1.4",
					})}
				>
					順心広尾学園同窓会規約
				</h1>
				<a
					href={CODE_REPO_URL}
					target="_blank"
					rel="noreferrer"
					className={css({
						display: "inline-flex",
						alignItems: "center",
						gap: "0.5rem",
						px: "1rem",
						py: "0.6rem",
						borderRadius: "0.5rem",
						border: "1px solid token(colors.gray.300)",
						color: "#444444",
						fontSize: "sm",
						fontWeight: "bold",
						textDecoration: "none",
						whiteSpace: "nowrap",
						transition: "background-color 0.15s ease, border-color 0.15s ease",
						_hover: { bg: "green.100", borderColor: "green.400" },
					})}
				>
					<IconBrandGithub size={20} stroke={1.75} />
					GitHubで会則を見る
				</a>
			</div>

			<div className={proseClass}>
				<ReactMarkdown components={{ p: Paragraph }}>{codeMarkdown}</ReactMarkdown>
			</div>
		</div>
	);
}
