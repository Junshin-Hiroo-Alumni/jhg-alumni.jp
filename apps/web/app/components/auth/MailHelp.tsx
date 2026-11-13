import { IconChevronDown } from "@tabler/icons-react";
import type { ReactNode } from "react";
import { css } from "styled-system/css";
import { MAIL_SENDER } from "~/lib/contact";

const itemClass = css({
	position: "relative",
	pl: "1rem",
	"&::before": {
		content: '"・"',
		position: "absolute",
		left: 0,
	},
});

/** 「メールが届かない場合」の折りたたみ。普段は閉じておき、画面の主な案内を邪魔しない */
export default function MailHelp({
	defaultOpen,
	items,
	children,
}: {
	defaultOpen?: boolean;
	/** 迷惑メールフォルダの案内に続けて表示する項目 */
	items?: ReactNode[];
	/** 項目の下に置く操作（再送信ボタンなど） */
	children?: ReactNode;
}) {
	return (
		<details
			open={defaultOpen}
			className={css({ "&[open] .chevron": { transform: "rotate(180deg)" } })}
		>
			<summary
				className={css({
					display: "inline-flex",
					alignItems: "center",
					gap: "0.25rem",
					fontSize: "sm",
					fontWeight: "bold",
					color: "green.700",
					cursor: "pointer",
					listStyle: "none",
					"&::-webkit-details-marker": { display: "none" },
					_hover: { color: "green.600" },
				})}
			>
				メールが届かない場合
				<IconChevronDown
					size={16}
					stroke={2.25}
					aria-hidden
					className={`chevron ${css({ transition: "transform 0.15s ease" })}`}
				/>
			</summary>
			<div
				className={css({
					mt: "0.875rem",
					p: "1rem",
					borderRadius: "0.5rem",
					bg: "gray.50",
					textAlign: "left",
					fontSize: "sm",
					lineHeight: "1.8",
					color: "gray.700",
				})}
			>
				<ul className={css({ display: "grid", gap: "0.375rem" })}>
					<li className={itemClass}>
						迷惑メールフォルダをご確認ください。
						<span className={css({ display: "block", color: "gray.500", whiteSpace: "nowrap" })}>
							送信元: {MAIL_SENDER}
						</span>
					</li>
					{items?.map((item, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: 固定の並びで、入れ替わらない
						<li key={i} className={itemClass}>
							{item}
						</li>
					))}
				</ul>
				{children && <div className={css({ mt: "1rem" })}>{children}</div>}
			</div>
		</details>
	);
}
