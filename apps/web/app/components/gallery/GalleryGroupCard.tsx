import { useEffect, useState } from "react";
import { Link } from "react-router";
import { css } from "styled-system/css";
import type { GalleryGroup } from "~/lib/gallery";

const GRID_SIZES = "(min-width: 768px) 33vw, 50vw";

// カードごとに傾きをバラつかせるプリセット
const TILT_PRESETS = [
	{ l3Deg: -5, l3Tx: -2.5, l2Deg: -2.5, l2Tx: -1.5 },
	{ l3Deg: 5, l3Tx: 2.5, l2Deg: 2.5, l2Tx: 1.5 },
	{ l3Deg: -4, l3Tx: -2, l2Deg: 3, l2Tx: 1.5 },
	{ l3Deg: 4, l3Tx: 2, l2Deg: -3, l2Tx: -1.5 },
	{ l3Deg: -1.5, l3Tx: -1, l2Deg: -0.5, l2Tx: -0.5 },
	{ l3Deg: -2, l3Tx: -1, l2Deg: 4, l2Tx: 2 },
	{ l3Deg: 2, l3Tx: 1, l2Deg: -4, l2Tx: -2 },
	{ l3Deg: -4.5, l3Tx: -2, l2Deg: 0, l2Tx: 0 },
] as const;

// 画像のシャッフル関数
function shuffle<T>(input: T[]): T[] {
	const result = [...input];
	for (let i = result.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[result[i], result[j]] = [result[j], result[i]];
	}
	return result;
}

interface GalleryGroupCardProps {
	group: GalleryGroup;
	/** 一覧表示時の登場アニメーション遅延（秒） */
	animationDelay?: number;
	/** 傾きプリセット選択用インデックス */
	index?: number;
}

export default function GalleryGroupCard({
	group,
	animationDelay = 0,
	index = 0,
}: GalleryGroupCardProps) {
	const [hovered, setHovered] = useState(false);
	const [layers, setLayers] = useState(() => group.images.slice(0, 3));
	const [presetIndex, setPresetIndex] = useState(index);

	useEffect(() => {
		setLayers(shuffle(group.images).slice(0, 3));
		setPresetIndex(Math.floor(Math.random() * TILT_PRESETS.length));
	}, [group.images]);

	const preset = TILT_PRESETS[presetIndex % TILT_PRESETS.length];
	const transition = "transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.45s ease";

	// ── ホバー時は各レイヤーがそれぞれの方向へ少しだけ動く（隣のカードと被るのを防ぐためマイルドに） ──
	const layer3Style: React.CSSProperties = {
		transform: hovered
			? `rotate(${preset.l3Deg * 1.3}deg) translate(${preset.l3Tx * 1.5}px, 6px)`
			: `rotate(${preset.l3Deg}deg) translate(${preset.l3Tx}px, 4px)`,
		transition,
		zIndex: 1,
	};
	const layer2Style: React.CSSProperties = {
		transform: hovered
			? `rotate(${preset.l2Deg * 1.4}deg) translate(${preset.l2Tx * 1.3}px, 3px)`
			: `rotate(${preset.l2Deg}deg) translate(${preset.l2Tx}px, 2px)`,
		transition,
		zIndex: 2,
	};
	const frontStyle: React.CSSProperties = {
		transform: hovered ? "translateY(-5px) rotate(0.3deg)" : "translateY(0) rotate(0deg)",
		boxShadow: hovered ? "0 12px 28px rgba(20, 50, 30, 0.25)" : "0 6px 20px rgba(20, 50, 30, 0.22)",
		transition,
		zIndex: 3,
	};

	// 写真プリント風の白ボーダー
	const photoLayerClass = css({
		position: "absolute",
		inset: "0",
		overflow: "hidden",
		border: { base: "4px solid white", md: "5px solid white" },
		boxSizing: "border-box",
		transformOrigin: "bottom center",
	});

	return (
		<Link
			to={`/gallery/${group.id}`}
			onMouseEnter={() => setHovered(true)}
			onMouseLeave={() => setHovered(false)}
			className={css({
				display: "block",
				textDecoration: "none",
				color: "inherit",
				animationName: "stackCardIn",
				animationDuration: "0.65s",
				animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
				animationFillMode: "both",
				_motionReduce: { animationName: "none" },
				maxW: { base: "145px", md: "none" },
				mx: { base: "auto", md: "0" },
				w: "full",
			})}
			style={{ animationDelay: `${animationDelay}s` }}
			aria-label={`${group.title}（${group.images.length}枚）を見る`}
		>
			<div
				className={css({
					position: "relative",
					width: "100%",
					paddingBottom: { base: "70%", md: "78%" },
					mb: { base: "2rem", md: "3.5rem" },
				})}
			>
				{/* レイヤー 3（最背面）*/}
				{layers.length >= 3 && (
					<div
						className={photoLayerClass}
						style={{ ...layer3Style, boxShadow: "0 3px 10px rgba(0,0,0,0.22)" }}
					>
						<picture>
							<source type="image/avif" srcSet={layers[2].avifSrcSet} sizes={GRID_SIZES} />
							<source type="image/webp" srcSet={layers[2].webpSrcSet} sizes={GRID_SIZES} />
							<img
								src={layers[2].fallbackSrc}
								alt=""
								width={layers[2].width}
								height={layers[2].height}
								loading="lazy"
								decoding="async"
								className={css({
									width: "100%",
									height: "100%",
									objectFit: "cover",
									display: "block",
								})}
								style={{
									backgroundImage: `url(${layers[2].lqip})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						</picture>
					</div>
				)}

				{layers.length >= 2 && (
					<div
						className={photoLayerClass}
						style={{ ...layer2Style, boxShadow: "0 3px 12px rgba(0,0,0,0.24)" }}
					>
						<picture>
							<source type="image/avif" srcSet={layers[1].avifSrcSet} sizes={GRID_SIZES} />
							<source type="image/webp" srcSet={layers[1].webpSrcSet} sizes={GRID_SIZES} />
							<img
								src={layers[1].fallbackSrc}
								alt=""
								width={layers[1].width}
								height={layers[1].height}
								loading="lazy"
								decoding="async"
								className={css({
									width: "100%",
									height: "100%",
									objectFit: "cover",
									display: "block",
								})}
								style={{
									backgroundImage: `url(${layers[1].lqip})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						</picture>
					</div>
				)}

				{/* レイヤー 1（前面・カバー）*/}
				{layers.length >= 1 && (
					<div className={photoLayerClass} style={frontStyle}>
						<picture>
							<source type="image/avif" srcSet={layers[0].avifSrcSet} sizes={GRID_SIZES} />
							<source type="image/webp" srcSet={layers[0].webpSrcSet} sizes={GRID_SIZES} />
							<img
								src={layers[0].fallbackSrc}
								alt=""
								width={layers[0].width}
								height={layers[0].height}
								loading="lazy"
								decoding="async"
								className={css({
									width: "100%",
									height: "100%",
									objectFit: "cover",
									display: "block",
								})}
								style={{
									transform: hovered ? "scale(1.04)" : "scale(1)",
									transition: "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)",
									backgroundImage: `url(${layers[0].lqip})`,
									backgroundSize: "cover",
									backgroundPosition: "center",
								}}
							/>
						</picture>
					</div>
				)}
			</div>

			<div>
				<h2
					className={css({
						fontSize: { base: "0.95rem", md: "1.05rem" },
						fontWeight: "700",
						color: "#1a1a1a",
						mb: group.description ? "0.4rem" : "0",
						lineHeight: "1.4",
						transition: "color 0.2s ease",
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					})}
					style={{ color: hovered ? "#44a768" : "#1a1a1a" }}
				>
					{group.title}
				</h2>
				{group.description && (
					<p
						className={css({
							fontSize: "0.82rem",
							color: "#666",
							lineHeight: "1.65",
							display: "-webkit-box",
							overflow: "hidden",
						})}
						style={
							{
								// biome-ignore lint/style/useNamingConvention: webkit vendor prefix is required
								WebkitLineClamp: "2",
								// biome-ignore lint/style/useNamingConvention: webkit vendor prefix is required
								WebkitBoxOrient: "vertical",
							} as React.CSSProperties
						}
					>
						{group.description}
					</p>
				)}
			</div>
		</Link>
	);
}
