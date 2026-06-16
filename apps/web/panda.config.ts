import { defineConfig } from "@pandacss/dev";

export default defineConfig({
	preflight: true,
	jsxFramework: "react",

	include: ["./app/**/*.{js,jsx,ts,tsx}"],

	exclude: [],

	// キーフレームをグローバルCSSとして常に出力する
	globalCss: {
		"@keyframes fadeInText": {
			"0%": { opacity: "0", transform: "translateY(20px)" },
			"100%": { opacity: "1", transform: "translateY(0)" },
		},
		// 上から下へ文字が生えてくる（クリップで上から順に表示）
		"@keyframes growDown": {
			"0%": { clipPath: "inset(0 0 100% 0)" },
			"100%": { clipPath: "inset(0 0 0 0)" },
		},
		// サイトのローディング: ロゴが現れて拡大しながら消える
		"@keyframes siteLoaderLogo": {
			"0%": { opacity: "0", transform: "scale(0.85)" },
			"22%": { opacity: "1", transform: "scale(1)" },
			"58%": { opacity: "1", transform: "scale(1)" },
			"100%": { opacity: "0", transform: "scale(6)" },
		},
		// オーバーレイ(白背景)が最後にフェードアウトしてページが現れる
		"@keyframes siteLoaderOverlay": {
			"0%": { opacity: "1" },
			"72%": { opacity: "1" },
			"100%": { opacity: "0" },
		},
		// ギャラリー拡大表示: 背景フェードイン
		"@keyframes lightboxFade": {
			"0%": { opacity: "0" },
			"100%": { opacity: "1" },
		},
		// ギャラリー拡大表示: 画像がふわっと拡大しながら現れる
		"@keyframes lightboxIn": {
			"0%": { opacity: "0", transform: "scale(0.92) translateY(10px)" },
			"100%": { opacity: "1", transform: "scale(1) translateY(0)" },
		},
		// ギャラリー一覧: サムネイルがふわっとフェードイン（最終状態は必ず表示）
		"@keyframes galleryItemIn": {
			"0%": { opacity: "0" },
			"100%": { opacity: "1" },
		},
		// 窓(外側)と中身(内側)を逆方向に動かして相殺し、中身は静止したまま見える範囲だけ広がる。
		"@keyframes heroWipeWindow": {
			"0%": { transform: "translateY(-100%)" },
			"100%": { transform: "translateY(0)" },
		},
		"@keyframes heroWipeContent": {
			"0%": { transform: "translateY(100%)" },
			"100%": { transform: "translateY(0)" },
		},
	},

	theme: {
		extend: {
			keyframes: {
				fadeInText: {
					"0%": { opacity: "0", transform: "translateY(20px)" },
					"100%": { opacity: "1", transform: "translateY(0)" },
				},
				growDown: {
					"0%": { clipPath: "inset(0 0 100% 0)" },
					"100%": { clipPath: "inset(0 0 0 0)" },
				},
				siteLoaderLogo: {
					"0%": { opacity: "0", transform: "scale(0.85)" },
					"22%": { opacity: "1", transform: "scale(1)" },
					"58%": { opacity: "1", transform: "scale(1)" },
					"100%": { opacity: "0", transform: "scale(6)" },
				},
				siteLoaderOverlay: {
					"0%": { opacity: "1" },
					"72%": { opacity: "1" },
					"100%": { opacity: "0" },
				},
				lightboxFade: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				lightboxIn: {
					"0%": { opacity: "0", transform: "scale(0.92) translateY(10px)" },
					"100%": { opacity: "1", transform: "scale(1) translateY(0)" },
				},
				galleryItemIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				heroWipeWindow: {
					"0%": { transform: "translateY(-100%)" },
					"100%": { transform: "translateY(0)" },
				},
				heroWipeContent: {
					"0%": { transform: "translateY(100%)" },
					"100%": { transform: "translateY(0)" },
				},
			},
			tokens: {
				fonts: {
					// 外向きサイト用の丸ゴシック
					maru: { value: '"Zen Maru Gothic", sans-serif' },
				},
				sizes: {
					frameThickness: { value: "17px" },
				},
				colors: {
					gray: {
						100: { value: "#ecf0f3" },
					},
					green: {
						100: { value: "#dff3e9" },
						200: { value: "#c9eada" },
						300: { value: "#a8dec4" },
						400: { value: "#88d2ae" },
						500: { value: "#44a768" },
					},
				},
			},
		},
	},

	outdir: "styled-system",
});
