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
				{HERO_LINES.map((line, index) => {
					// 窓(外側)と中身(内側)を逆方向に動かして相殺 → 中身は静止したまま上→下にワイプ。
					// clip-path を使わず transform だけなので iOS WebKit でも確実に動く。両者は同じ
					// duration / easing / delay で完全同期させる（main の緩急をそのまま再現）。
					const delay = `${HERO_START_DELAY + index * 0.7}s`;
					return (
						<div
							key={line}
							className={css({
								overflow: "hidden",
								// iOS WebKit は「中身に縮む箱」を縦書きテキストのサイズに正しく計算できず
								// 文字が箱からはみ出す。箱自身を縦書きにすると正しくサイズされる（窓・中身とも）。
								writingMode: "vertical-rl",
								animationName: "heroWipeWindow",
								animationDuration: "1.1s",
								animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
								animationFillMode: "both",
							})}
							style={{ animationDelay: delay }}
						>
							<div
								className={css({
									bg: "white",
									// 箱が vertical-rl だと論理 px/py(inline/block)は軸が入れ替わり太く見える。
									// 物理プロパティで指定し、元の見た目（左右=細い / 上下=広い）を維持する。
									paddingLeft: "2",
									paddingRight: "2",
									paddingTop: { base: "3", md: "4" },
									paddingBottom: { base: "3", md: "4" },
									writingMode: "vertical-rl",
									animationName: "heroWipeContent",
									animationDuration: "1.1s",
									animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
									animationFillMode: "both",
								})}
								style={{ animationDelay: delay }}
							>
								<span
									className={css({
										display: "block",
										// text-orientation: upright は iOS Safari でグリフが描画されず文字が消える
										// 不具合がある。日本語のみなので既定の mixed でも同じ「縦書き・正立」になる。
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
						</div>
					);
				})}
			</div>
		</div>
	);
}
