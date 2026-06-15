import ReactMarkdown from "react-markdown";
import { css } from "styled-system/css";

// 会則の Markdown（app/content/code.md）を取り込む。.md を編集すると反映されます。
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
	"& ul": { pl: "1.5rem", my: "1rem", listStyleType: "disc" },
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

export function meta() {
	return [{ title: "会則 | 順心広尾学園同窓会" }];
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
			<div className={proseClass}>
				<ReactMarkdown>{codeMarkdown}</ReactMarkdown>
			</div>
		</div>
	);
}
