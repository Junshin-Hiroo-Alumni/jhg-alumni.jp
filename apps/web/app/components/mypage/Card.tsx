import type { ReactNode } from "react";
import { css } from "styled-system/css";

export const CARD_PX = { base: "1.25rem", md: "1.5rem" };

export const primaryActionClass = css({
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	gap: "0.5rem",
	width: { base: "100%", sm: "10rem" },
	height: "2.5rem",
	px: "1rem",
	borderRadius: "9999px",
	bg: "green.600",
	color: "white",
	border: "none",
	boxShadow: "0 1px 2px rgba(16, 24, 40, 0.08), 0 4px 12px -4px rgba(22, 163, 74, 0.45)",
	fontSize: "sm",
	fontWeight: "bold",
	letterSpacing: "0.04em",
	whiteSpace: "nowrap",
	cursor: "pointer",
	transition: "background-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
	_hover: { bg: "green.700" },
	_disabled: { opacity: 0.5, cursor: "not-allowed" },
	_focusVisible: { outline: "2px solid token(colors.green.500)", outlineOffset: "2px" },
	"& > svg": { transform: "translateY(-0.1em)", transition: "transform 0.15s ease" },
	"&:hover:not(:disabled) > svg:last-child": { transform: "translate(2px, -0.1em)" },
});

/** 見出し・本文・下端の操作欄からなるカード */
export function Card({
	id,
	title,
	description,
	children,
}: {
	id: string;
	title: string;
	description?: string;
	children: ReactNode;
}) {
	return (
		<section
			aria-labelledby={id}
			className={css({
				bg: "white",
				border: "1px solid token(colors.mypage.line)",
				borderRadius: "0.75rem",
				boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
				overflow: "hidden",
			})}
		>
			<div className={css({ px: CARD_PX, pt: "1.25rem" })}>
				<h2 id={id} className={css({ fontSize: "md", fontWeight: "bold" })}>
					{title}
				</h2>
				{description && (
					<p
						className={css({ mt: "0.25rem", fontSize: "sm", color: "gray.500", lineHeight: "1.7" })}
					>
						{description}
					</p>
				)}
			</div>
			{children}
		</section>
	);
}

/** カード下端の操作欄。左に補足、右に操作ボタンを置く */
export function CardFooter({ note, children }: { note?: ReactNode; children: ReactNode }) {
	return (
		<div
			className={css({
				display: "flex",
				flexWrap: "wrap",
				alignItems: "center",
				justifyContent: "flex-end",
				gap: "0.75rem 1.5rem",
				px: CARD_PX,
				pb: "1.25rem",
			})}
		>
			<div
				className={css({ flex: "1 1 16rem", fontSize: "sm", color: "gray.500", lineHeight: "1.6" })}
			>
				{note}
			</div>
			{children}
		</div>
	);
}
