import { tz } from "@date-fns/tz";
import { loadDefaultJapaneseParser } from "budoux";
import { format } from "date-fns";
import { Badge } from "./common/badge";

export interface NewsProps {
	publishedAt?: string;
	title: string;
	description?: string;
	category?: string;
}
export function News({ publishedAt, title, description, category }: NewsProps) {
	const parser = loadDefaultJapaneseParser();
	const parsed = {
		title: parser.parse(title).join("\u200B"),
		description: description ? parser.parse(description).join("\u200B") : undefined,
	};
	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				padding: "30px",
			}}
		>
			<div
				style={{
					paddingTop: "60px",
					paddingInline: "30px",
				}}
			>
				<p
					style={{
						display: "inline-flex",
						gap: "2rem",
						alignItems: "baseline",
					}}
				>
					<span
						style={{
							fontSize: "var(--text-sm)",
							color: "var(--color-muted)",
							fontWeight: 500,
						}}
					>
						{publishedAt &&
							format(new Date(publishedAt), "yyyy.MM.dd (E)", { in: tz("Asia/Tokyo") })}
					</span>
					{category && <Badge>{category}</Badge>}
				</p>
				<h1
					style={{
						fontSize: "var(--text-lg)",
						maxHeight: "calc(var(--text-lg) * 3)",
						fontWeight: 500,
						margin: 0,
						marginBottom: "2rem",
						lineHeight: "1",
						wordBreak: "keep-all",
						overflowWrap: "anywhere",
						textAutospace: "normal",
						textSpacingTrim: "normal",
						textOverflow: "ellipsis",
					}}
				>
					{parsed.title}
				</h1>
				<p
					style={{
						fontSize: "var(--text-sm)",
						fontWeight: 500,
						margin: 0,
						maxHeight: "calc(var(--text-sm) * 3)",
						wordBreak: "keep-all",
						color: "var(--color-muted)",
						overflowWrap: "anywhere",
						textAutospace: "normal",
						textSpacingTrim: "normal",
						textOverflow: "ellipsis",
					}}
				>
					{parsed.description}
				</p>
			</div>
		</div>
	);
}
