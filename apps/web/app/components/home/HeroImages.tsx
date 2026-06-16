import { useEffect, useState } from "react";
import { css } from "styled-system/css";

const IMAGES = ["/site/home/5.webp", "/site/home/6.webp", "/site/home/3.webp", "/site/home/1.webp"];

// 縦書き・row-reverse のため、配列の先頭(右側)から読む
const HERO_LINES = ["母校でつながり", "未来へつなぐ"];

// ローディングアニメーション(約1.2s)が終わってから文字を出すための開始遅延
const HERO_START_DELAY = 1.2;

export default function HeroImages() {
	const [currentIndex, setCurrentIndex] = useState(0);

	useEffect(() => {
		const timer = setInterval(() => {
			setCurrentIndex(prevIndex => (prevIndex + 1) % IMAGES.length);
		}, 3000);
		return () => clearInterval(timer);
	}, []);

	return (
		<div
			className={css({
				width: "100%",
				height: "100dvh",
				position: "relative",
				overflow: "hidden",
				backgroundColor: "gray.900",
			})}
		>
			{IMAGES.map((src, index) => (
				<img
					key={src}
					src={src}
					alt={`Hero Background ${index + 1}`}
					data-active={index === currentIndex}
					className={css({
						position: "absolute",
						top: 0,
						left: 0,
						width: "100%",
						height: "100%",
						objectFit: "cover",
						opacity: 0,
						transition: "opacity 0.7s ease-in-out",
						"&[data-active='true']": {
							opacity: 1,
						},
					})}
				/>
			))}
			<div
				className={css({
					position: "absolute",
					bottom: { base: "8vh", md: "12vh" },
					left: { base: "6vw", md: "12vw" },
					zIndex: 10,
					display: "flex",
					flexDirection: "row-reverse",
					alignItems: "flex-start",
					gap: { base: "0.6rem", md: "1.2rem" },
				})}
			>
				{HERO_LINES.map((line, index) => (
					<div
						key={line}
						className={css({
							bg: "white",
							px: "2",
							py: { base: "3", md: "4" },
							animationName: "growDown",
							animationDuration: "1.1s",
							animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
							animationFillMode: "both",
						})}
						style={{ animationDelay: `${HERO_START_DELAY + index * 0.7}s` }}
					>
						<span
							className={css({
								display: "block",
								// text-orientation: upright は iOS Safari でグリフが描画されず文字が消える不具合がある。
								// 文字列はすべて日本語(漢字+ひらがな)なので、既定の mixed でも同じ「縦書き・正立」になる。
								writingMode: "vertical-rl",
								color: "black",
								fontWeight: "bold",
								fontSize: { base: "xl", md: "3xl" },
								letterSpacing: { base: "0.12em", md: "0.2em" },
							})}
						>
							{line}
						</span>
					</div>
				))}
			</div>
		</div>
	);
}
