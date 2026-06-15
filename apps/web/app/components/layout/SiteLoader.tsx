import { useEffect, useState } from "react";
import { css } from "styled-system/css";

// オーバーレイのフェードアウト完了に合わせて DOM から外す
const DURATION_MS = 2200;

export default function SiteLoader() {
	const [visible, setVisible] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setVisible(false), DURATION_MS);
		return () => clearTimeout(timer);
	}, []);

	if (!visible) {
		return null;
	}

	return (
		<div
			aria-hidden="true"
			className={css({
				position: "fixed",
				inset: "0",
				zIndex: "9999",
				bg: "#ffffff",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				overflow: "hidden",
				animationName: "siteLoaderOverlay",
				animationDuration: "1.2s",
				animationTimingFunction: "ease",
				animationFillMode: "forwards",
			})}
		>
			<img
				src="/common/base-logo.svg"
				alt=""
				className={css({
					width: { base: "96px", md: "120px" },
					height: "auto",
					animationName: "siteLoaderLogo",
					animationDuration: "1.2s",
					animationTimingFunction: "cubic-bezier(0.6, 0, 0.4, 1)",
					animationFillMode: "forwards",
					willChange: "transform, opacity",
				})}
			/>
		</div>
	);
}
