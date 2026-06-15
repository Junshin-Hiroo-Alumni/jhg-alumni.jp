import { css } from "styled-system/css";

type ImagePlaceholderProps = {
	/** 差し替え時の目印ラベル */
	label?: string;
	/** CSS の aspect-ratio 値（例: "16 / 9", "3 / 4", "1 / 1"） */
	aspectRatio?: string;
};

/**
 * 画像差し替え用のプレースホルダー枠。素材が用意できたら img に置き換える想定。
 */
export default function ImagePlaceholder({
	label = "画像",
	aspectRatio = "16 / 9",
}: ImagePlaceholderProps) {
	return (
		<div
			style={{ aspectRatio }}
			className={css({
				width: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				bg: "green.100",
				color: "green.500",
				fontSize: "sm",
				fontWeight: "bold",
				borderRadius: "1rem",
				border: "2px dashed token(colors.green.300)",
			})}
		>
			{label}
		</div>
	);
}
