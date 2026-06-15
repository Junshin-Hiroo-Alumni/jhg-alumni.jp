import { IconExternalLink } from "@tabler/icons-react";
import { Link } from "react-router";
import { css } from "styled-system/css";
import type { NoticeItem } from "~/lib/notice";

const rowClass = css({
	display: "flex",
	flexDirection: { base: "column", sm: "row" },
	alignItems: { base: "flex-start", sm: "center" },
	gap: { base: "0.5rem", sm: "1.5rem" },
	py: "1.25rem",
	textDecoration: "none",
	borderBottom: "1px solid token(colors.gray.100)",
	transition: "background-color 0.15s ease",
	_hover: { bg: "green.100" },
});

const dateClass = css({ color: "#888888", fontSize: "sm", flexShrink: 0 });

const categoryClass = css({
	flexShrink: 0,
	// カテゴリ文字数に依らずタイトル開始位置を揃えるため、横並び時は固定幅＋中央寄せにする
	textAlign: "center",
	minWidth: { sm: "5rem" },
	fontSize: "xs",
	fontWeight: "bold",
	color: "green.500",
	bg: "green.100",
	borderRadius: "9999px",
	px: "0.75rem",
	py: "0.25rem",
});

const titleClass = css({
	color: "#333333",
	fontWeight: "bold",
	display: "inline-flex",
	alignItems: "center",
	gap: "0.4rem",
});

function RowInner({ item }: { item: NoticeItem }) {
	return (
		<>
			<span className={dateClass}>{item.formattedDate}</span>
			<span className={categoryClass}>{item.category}</span>
			<span className={titleClass}>
				{item.title}
				{item.href && <IconExternalLink size={16} aria-label="外部リンク（PDF）" />}
			</span>
		</>
	);
}

export default function NoticeList({ items }: { items: NoticeItem[] }) {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				borderTop: "1px solid token(colors.gray.100)",
			})}
		>
			{items.map(item =>
				item.href ? (
					<a
						key={item.slug}
						href={item.href}
						target="_blank"
						rel="noopener noreferrer"
						className={rowClass}
					>
						<RowInner item={item} />
					</a>
				) : (
					<Link key={item.slug} to={`/notice/${item.slug}`} className={rowClass}>
						<RowInner item={item} />
					</Link>
				),
			)}
		</div>
	);
}
