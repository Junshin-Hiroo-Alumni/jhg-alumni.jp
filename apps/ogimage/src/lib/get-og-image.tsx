import { render } from "takumi-js";
import { googleFonts } from "takumi-js/helpers";
import { Gallery, type GalleryProps } from "../components/gallery";
import { News, type NewsProps } from "../components/news";
import { getAsset } from "./get-asset";

type GetOgImageArgs = { type: "news"; data: NewsProps } | { type: "gallery"; data: GalleryProps };
export async function getOgImage({ type, data }: GetOgImageArgs) {
	const content = () => {
		switch (type) {
			case "news": {
				return <News {...data} />;
			}
			case "gallery": {
				return <Gallery {...data} />;
			}
			default: {
				return <div></div>;
			}
		}
	};
	return render(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "grid",
				placeItems: "center",
			}}
		>
			<div
				style={{
					gridArea: "1 / 1 / -1 / -1",
					width: "100%",
					height: "100%",
				}}
			>
				{content()}
			</div>
			<img
				style={{
					gridArea: "1 / 1 / -1 / -1",
					zIndex: "-100",
					width: "100%",
					height: "100%",
				}}
				src="frame"
				alt=""
			/>
		</div>,
		{
			width: 1200,
			height: 630,
			images: [{ src: "frame", data: () => getAsset("frame.svg").then(res => res.arrayBuffer()) }],
			fonts: googleFonts([{ name: "Zen Maru Gothic", weight: [500] }]),
			css: {
				selector: ":root",
				style: {
					"--text-xs": "24px",
					"--text-sm": "36px",
					"--text-lg": "72px",
					"--color-muted": "#4d4d4d",
				},
			},
		},
	);
}
