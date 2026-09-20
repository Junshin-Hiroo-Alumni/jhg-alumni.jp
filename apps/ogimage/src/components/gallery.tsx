import { loadDefaultJapaneseParser } from "budoux";
import { ImageFrame } from "./common/image-frame";

export interface GalleryProps {
	title: string;
	description?: string;
	images: string[];
}

export function Gallery({ title, description, images }: GalleryProps) {
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
				display: "grid",
				gridTemplateColumns: "1fr 1fr",
			}}
		>
			<div
				style={{
					paddingTop: "60px",
					paddingLeft: "30px",
					paddingRight: "40px",
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
						フォトギャラリー
					</span>
				</p>
				<h1
					style={{
						fontSize: "var(--text-lg)",
						maxHeight: "calc(var(--text-lg) * 2)",
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
						maxHeight: "calc(var(--text-sm) * 5)",
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
			<div
				style={{
					alignSelf: "center",
					position: "relative",
				}}
			>
				{images.map((image, i) => (
					<ImageFrame
						className="image-frame"
						src={image}
						key={`${image}`}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							transform: (() => {
								const translateY = "translateY(-50%)";
								switch (i) {
									case 0: {
										return `${translateY} translateX(-5px) rotate(5deg)`;
									}
									case 1: {
										return `${translateY} rotate(-3deg)`;
									}
									case 2: {
										return translateY;
									}
								}
							})(),
						}}
					/>
				))}
			</div>
		</div>
	);
}
