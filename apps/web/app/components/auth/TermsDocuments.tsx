import ReactMarkdown from "react-markdown";
import { Link } from "react-router";
import { css } from "styled-system/css";
import { textLinkClass } from "~/components/auth/styles";

const documents = import.meta.glob("../../content/terms/{service,privacy}.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const serviceMarkdown = documents["../../content/terms/service.md"] ?? "";
const privacyMarkdown = documents["../../content/terms/privacy.md"] ?? "";

const documentClass = css({
	fontSize: "xs",
	lineHeight: "1.8",
	color: "gray.700",
	"& h1": { fontSize: "sm", fontWeight: "bold", color: "gray.900", mb: "0.75rem" },
	"& h2": { fontSize: "xs", fontWeight: "bold", color: "gray.900", mt: "1.25rem", mb: "0.25rem" },
	"& h3": { fontWeight: "bold", mt: "1rem" },
	"& p": { my: "0.5rem" },
	"& ul": { pl: "1.25rem", my: "0.5rem", listStyleType: "disc" },
	"& ol": { pl: "1.25rem", my: "0.5rem", listStyleType: "decimal" },
	"& a": { color: "green.700", textDecoration: "underline" },
	"& strong": { fontWeight: "bold" },
	"& + &": { mt: "2rem", pt: "1.5rem", borderTop: "1px solid token(colors.gray.200)" },
});

/** 利用規約とプライバシーポリシーの本文をスクロール枠で見せる */
export default function TermsDocuments() {
	return (
		<div>
			<section
				aria-label="利用規約とプライバシーポリシー"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: スクロール領域をキーボードでも読めるようにする
				tabIndex={0}
				className={css({
					maxH: "12rem",
					overflowY: "auto",
					p: "1rem 1.25rem",
					borderRadius: "0.5rem",
					border: "1px solid token(colors.gray.200)",
					bg: "gray.50",
					_focusVisible: { outline: "2px solid token(colors.green.500)", outlineOffset: "2px" },
				})}
			>
				<div className={documentClass}>
					<ReactMarkdown>{serviceMarkdown}</ReactMarkdown>
				</div>
				<div className={documentClass}>
					<ReactMarkdown>{privacyMarkdown}</ReactMarkdown>
				</div>
			</section>
			<p className={css({ mt: "0.5rem", fontSize: "xs", color: "gray.500", textAlign: "right" })}>
				別のタブで読む:{" "}
				<Link to="/terms/service" target="_blank" rel="noopener" className={textLinkClass}>
					利用規約
				</Link>
				{" / "}
				<Link to="/terms/privacy" target="_blank" rel="noopener" className={textLinkClass}>
					プライバシーポリシー
				</Link>
			</p>
		</div>
	);
}
