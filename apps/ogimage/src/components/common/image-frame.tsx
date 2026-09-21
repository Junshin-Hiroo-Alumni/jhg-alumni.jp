import type { ComponentProps } from "react";

interface ImageFrameProps {
	src: string;
}
export function ImageFrame({ src, style, ...props }: ComponentProps<"div"> & ImageFrameProps) {
	return (
		<div
			style={{
				width: "90%",
				backgroundColor: "white",
				position: "relative",
				boxShadow: "0 0 2px color-mix(in oklch, black, transparent 20%)",
				...style,
			}}
			{...props}
		>
			<img
				src={src}
				alt=""
				style={{
					width: "100%",
					"--padding": "0.7rem",
					paddingInline: "var(--padding)",
					paddingBlock: "calc(var(--padding) / 16 * 9)",
					objectFit: "cover",
					aspectRatio: "16 / 9",
				}}
			/>
		</div>
	);
}
