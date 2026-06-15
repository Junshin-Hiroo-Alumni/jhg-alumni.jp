import { css } from "styled-system/css";

type SectionHeadingProps = {
	/** 装飾用の英字ラベル（任意） */
	eyebrow?: string;
	/** セクション見出し（日本語） */
	title: string;
	/** 中央寄せ / 左寄せ */
	align?: "center" | "left";
};

export default function SectionHeading({ eyebrow, title, align = "center" }: SectionHeadingProps) {
	const isCenter = align === "center";
	return (
		<div
			className={css({
				mb: { base: "2.5rem", md: "3.5rem" },
			})}
			style={{ textAlign: isCenter ? "center" : "left" }}
		>
			{eyebrow && (
				<p
					className={css({
						color: "green.500",
						fontWeight: "bold",
						letterSpacing: "0.2em",
						fontSize: "sm",
						mb: "0.75rem",
					})}
				>
					{eyebrow}
				</p>
			)}
			<h2
				className={css({
					fontSize: { base: "1.75rem", md: "2.25rem" },
					fontWeight: "bold",
					color: "#222222",
					lineHeight: "1.3",
				})}
			>
				{title}
			</h2>
			<div
				className={css({
					width: "44px",
					height: "3px",
					bg: "green.400",
					borderRadius: "9999px",
					mt: "1.25rem",
				})}
				style={{ marginInline: isCenter ? "auto" : undefined }}
			/>
		</div>
	);
}
