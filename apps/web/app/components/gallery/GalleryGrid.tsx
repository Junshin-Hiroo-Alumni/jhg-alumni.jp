import { IconChevronLeft, IconChevronRight, IconX } from "@tabler/icons-react";
import { useCallback, useEffect, useState } from "react";
import { css } from "styled-system/css";
import type { GalleryImage } from "~/lib/gallery";

const masonryClass = css({
	columnCount: { base: 2, md: 3, lg: 4 },
	columnGap: { base: "0.75rem", md: "1rem" },
});

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
			preload.src = ordered[n].src;
		}
	}, [index, total, ordered]);

	return (
		<>
			<div className={masonryClass}>
				{ordered.map((image, i) => (
					<button
						key={image.src}
						type="button"
						className={itemClass}
						onClick={() => setIndex(i)}
						aria-label={`写真を拡大表示（${i + 1} / ${total}）`}
					>
						<img src={image.src} alt="" loading="lazy" decoding="async" className={imgClass} />
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

					<img
						key={ordered[index].src}
						src={ordered[index].src}
						alt=""
						decoding="async"
						className={lightboxImgClass}
					/>

					<span className={counterClass}>
						{index + 1} / {total}
					</span>
				</div>
			)}
		</>
	);
}
