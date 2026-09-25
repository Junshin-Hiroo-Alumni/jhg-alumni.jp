import { Link } from "react-router";
import { css } from "styled-system/css";

/** 左上に固定表示するロゴ。`large` はトップページのスクロール前に大きく表示するとき */
export default function SiteLogo({ large = false }: { large?: boolean }) {
	return (
		<Link
			to="/"
			aria-label="ホーム"
			className={css({
				position: "fixed",
				top: { base: "1.25rem", md: "2.5rem" },
				left: { base: "1.25rem", md: "2.5rem" },
				zIndex: "100",
				display: "block",
				lineHeight: "0",
			})}
		>
			<img
				src="/common/base-logo.svg"
				alt="ロゴ"
				data-large={large}
				className={css({
					height: "auto",
					display: "block",
					transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
					width: { base: "88px", md: "150px" },
					"&[data-large='false']": { width: { base: "48px", md: "64px" } },
				})}
			/>
		</Link>
	);
}
