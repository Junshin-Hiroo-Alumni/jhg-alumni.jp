import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import type { GalleryImage } from "~/lib/gallery";

const masonryClass = css({
	columnCount: { base: 2, md: 3, lg: 4 },
	columnGap: { base: "0.75rem", md: "1rem" },
});

// グリッドのタイル幅: base=2列(50vw) / md=3列(33vw) / lg=4列(25vw)。
// これでブラウザがスマホ用/PC用・低/高解像度の最適な1枚を srcset から選ぶ。
const GRID_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";
// ライトボックスの画像幅: maxW min(1100px, 92vw)。
const LIGHTBOX_SIZES = "(min-width: 1196px) 1100px, 92vw";

const itemClass = css({
	display: "block",
	width: "100%",
	m: "0",
	mb: { base: "0.75rem", md: "1rem" },
	p: "0",
	border: "none",
	bg: "#ffffff",
	breakInside: "avoid",
	borderRadius: "0.75rem",
	overflow: "hidden",
	boxShadow: "0 4px 16px rgba(31, 71, 51, 0.1)",
	cursor: "zoom-in",
	// ふわっとフェードイン。素の状態は表示(opacity 1)のままで、その上にアニメを重ねるだけなので
	// JSの読み込み判定に依存せず、タイルが透明のまま残ることが起きない。
	// 縦移動は使わない: 列ごとに表示タイミングがずれると列トップだけ下がって見えるため。
	animationName: "galleryItemIn",
	animationDuration: "0.7s",
	animationTimingFunction: "ease",
	animationFillMode: "both",
	// 動きを減らす設定のユーザーにはアニメなし（即時表示）
	_motionReduce: {
		animationName: "none",
	},
});

const imgClass = css({
	width: "100%",
	height: "auto",
	display: "block",
	transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
	_hover: { transform: "scale(1.04)" },
});

const overlayClass = css({
	position: "fixed",
	inset: "0",
	zIndex: "1000",
	display: "flex",
	alignItems: "center",
	justifyContent: "center",
	p: { base: "1rem", md: "2rem" },
});

// 背景全面を覆う閉じるボタン（画像の外側クリックで閉じる）
const backdropClass = css({
	position: "absolute",
	inset: "0",
	bg: "rgba(0, 0, 0, 0.85)",
	backdropFilter: "blur(4px)",
	border: "none",
	p: "0",
	m: "0",
	cursor: "zoom-out",
	animationName: "lightboxFade",
	animationDuration: "0.3s",
	animationTimingFunction: "ease",
	animationFillMode: "both",
});

const lightboxImgClass = css({
	position: "relative",
	zIndex: "1",
	maxW: "min(1100px, 92vw)",
	maxH: "88vh",
	width: "auto",
	height: "auto",
	objectFit: "contain",
	borderRadius: "0.5rem",
	boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)",
	pointerEvents: "none",
	animationName: "lightboxIn",
	animationDuration: "0.45s",
	animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
	animationFillMode: "both",
	willChange: "transform, opacity",
});

const ctrlClass = css({
	position: "absolute",
	zIndex: "1",
	display: "inline-flex",
	alignItems: "center",
	justifyContent: "center",
	color: "#ffffff",
	bg: "rgba(255, 255, 255, 0.12)",
	borderRadius: "9999px",
	border: "none",
	cursor: "pointer",
	width: "2.75rem",
	height: "2.75rem",
	transition: "background-color 0.15s ease",
	_hover: { bg: "rgba(255, 255, 255, 0.25)" },
});

const counterClass = css({
	position: "absolute",
	zIndex: "1",
	bottom: { base: "1rem", md: "1.5rem" },
	left: "50%",
	transform: "translateX(-50%)",
	color: "rgba(255, 255, 255, 0.85)",
	fontSize: "sm",
});

// Fisher-Yates シャッフル（元配列は変更しない）
function shuffle<T>(input: T[]): T[] {
	const result = [...input];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const tmp = result[i];
		result[i] = result[j];
		result[j] = tmp;
	}
	return result;
}

export default function GalleryGrid({ images }: { images: GalleryImage[] }) {
	// SSR は元順でレンダリングし、マウント後にクライアントでシャッフル（訪問ごとにランダム）
	const [ordered, setOrdered] = useState(images);
	const [index, setIndex] = useState<number | null>(null);
	const isOpen = index !== null;
	const total = ordered.length;

	useEffect(() => {
		setOrdered(shuffle(images));
	}, [images]);

	const close = useCallback(() => setIndex(null), []);
	const showPrev = useCallback(
		() => setIndex(i => (i === null ? i : (i + total - 1) % total)),
		[total],
	);
	const showNext = useCallback(() => setIndex(i => (i === null ? i : (i + 1) % total)), [total]);

	useEffect(() => {
		if (!isOpen) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
			else if (e.key === "ArrowLeft") showPrev();
			else if (e.key === "ArrowRight") showNext();
		};
		window.addEventListener("keydown", onKey);
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey);
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen, close, showPrev, showNext]);

	// 拡大表示中は前後の画像を先読みして送りを滑らかにする
	useEffect(() => {
		if (index === null || total < 2) return;
		for (const n of [(index + 1) % total, (index + total - 1) % total]) {
			const preload = new Image();
			preload.src = ordered[n].fullWebpSrc;
		}
	}, [index, total, ordered]);

	return (
		<>
			<div className={masonryClass}>
				{ordered.map((image, i) => (
					<button
						key={image.id}
						type="button"
						className={itemClass}
						onClick={() => setIndex(i)}
						aria-label={`写真を拡大表示（${i + 1} / ${total}）`}
					>
						<picture>
							<source type="image/avif" srcSet={image.avifSrcSet} sizes={GRID_SIZES} />
							<source type="image/webp" srcSet={image.webpSrcSet} sizes={GRID_SIZES} />
							<img
								src={image.fallbackSrc}
								alt=""
								width={image.width}
								height={image.height}
								loading="lazy"
								decoding="async"
								className={imgClass}
								// 読み込み中は LQIP（極小ぼかし）を背景に表示。画像が来たら上書きされる。
								style={{
									backgroundImage: `url(${image.lqip})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						</picture>
					</button>
				))}
			</div>

			{isOpen && index !== null && (
				<div className={overlayClass} role="dialog" aria-modal="true" aria-label="写真の拡大表示">
					<button type="button" className={backdropClass} onClick={close} aria-label="閉じる" />

					<button
						type="button"
						className={ctrlClass}
						style={{ top: "1rem", right: "1rem" }}
						onClick={close}
						aria-label="閉じる"
					>
						<IconX size={22} />
					</button>

					{total > 1 && (
						<>
							<button
								type="button"
								className={ctrlClass}
								style={{ left: "1rem", top: "50%", transform: "translateY(-50%)" }}
								onClick={showPrev}
								aria-label="前の写真"
							>
								<IconChevronLeft size={24} />
							</button>
							<button
								type="button"
								className={ctrlClass}
								style={{ right: "1rem", top: "50%", transform: "translateY(-50%)" }}
								onClick={showNext}
								aria-label="次の写真"
							>
								<IconChevronRight size={24} />
							</button>
						</>
					)}

					<picture key={ordered[index].id}>
						<source
							type="image/avif"
							srcSet={ordered[index].fullAvifSrcSet}
							sizes={LIGHTBOX_SIZES}
						/>
						<img
							src={ordered[index].fullWebpSrc}
							alt=""
							width={ordered[index].width}
							height={ordered[index].height}
							decoding="async"
							className={lightboxImgClass}
							style={{
								backgroundImage: `url(${ordered[index].lqip})`,
								backgroundSize: "cover",
								backgroundPosition: "center",
							}}
						/>
					</picture>

					<span className={counterClass}>
						{index + 1} / {total}
					</span>
				</div>
			)}
		</>
	);
}
