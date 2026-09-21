import type { ComponentProps } from "react";

export function Badge({ children, style, ...props }: ComponentProps<"span">) {
	return (
		<span
			style={{
				fontSize: "var(--text-xs)",
				color: "#16a34a",
				backgroundColor: "#dff3e9",
				borderRadius: "var(--text-xs)",
				paddingInline: "2rem",
				paddingBlock: "0.2rem",
				...style,
			}}
			{...props}
		>
			{children}
		</span>
	);
}
