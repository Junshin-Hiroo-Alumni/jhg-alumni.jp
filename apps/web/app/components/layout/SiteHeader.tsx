import { IconMenu2, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { css } from "styled-system/css";

type HeaderLink = {
	id: string;
	title: string;
	url: string;
};

const links: Array<HeaderLink> = [
	{ id: "nav-home", title: "ホーム", url: "/" },
	{ id: "nav-news", title: "お知らせ", url: "/notice" },
	{ id: "nav-board-meeting", title: "役員会", url: "/board-meeting" },
	{ id: "nav-rules", title: "会則", url: "/code" },
	{ id: "nav-gallery", title: "フォトギャラリー", url: "/gallery" },
];

const LOGO_SCROLL_THRESHOLD = 80;

export default function SiteHeader() {
	const { pathname } = useLocation();
	const isHome = pathname === "/";
	const [scrolled, setScrolled] = useState(false);
	const [menuOpen, setMenuOpen] = useState(false);

	useEffect(() => {
		if (!isHome) {
			return;
		}
		const onScroll = () => setScrolled(window.scrollY > LOGO_SCROLL_THRESHOLD);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, [isHome]);

	const isLogoLarge = isHome && !scrolled;

	return (
		<>
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
					data-large={isLogoLarge}
					className={css({
						height: "auto",
						display: "block",
						transition: "width 0.35s cubic-bezier(0.22, 1, 0.36, 1)",
						width: { base: "88px", md: "150px" },
						"&[data-large='false']": { width: { base: "48px", md: "64px" } },
					})}
				/>
			</Link>

			<header
				className={css({
					bg: "#FFFFFF",
					height: "3.5rem",
					display: "flex",
					alignItems: "center",
					position: "fixed",
					right: { base: "1rem", md: "1.5rem" },
					top: { base: "1.25rem", md: "1.5rem" },
					borderRadius: "9999px",
					px: { base: "1rem", md: "1.75rem" },
					boxShadow: "0 6px 24px rgba(0, 0, 0, 0.08)",
					zIndex: "100",
				})}
			>
				<div className={css({ display: "flex", alignItems: "center", gap: "1.5rem" })}>
					<nav
						className={css({
							display: { base: "none", lg: "flex" },
							alignItems: "center",
							gap: "2rem",
						})}
					>
						{links.map(link => (
							<Link
								key={link.id}
								to={link.url}
								className={css({
									fontWeight: "bold",
									fontSize: "md",
									color: "gray.800",
									whiteSpace: "nowrap",
									transition: "color 0.2s ease",
									_hover: { color: "green.600" },
								})}
							>
								{link.title}
							</Link>
						))}
					</nav>

					{/* モバイル: ハンバーガー */}
					<button
						type="button"
						aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
						aria-expanded={menuOpen}
						onClick={() => setMenuOpen(open => !open)}
						className={css({
							display: { base: "flex", lg: "none" },
							alignItems: "center",
							justifyContent: "center",
							width: "2.25rem",
							height: "2.25rem",
							borderRadius: "9999px",
							color: "gray.800",
							bg: "transparent",
							border: "none",
							cursor: "pointer",
							transition: "background-color 0.15s ease",
							_hover: { bg: "gray.100" },
						})}
					>
						{menuOpen ? <IconX size={22} /> : <IconMenu2 size={22} />}
					</button>
				</div>
			</header>

			{/* モバイルメニュー */}
			{menuOpen && (
				<>
					<button
						type="button"
						aria-label="メニューを閉じる"
						onClick={() => setMenuOpen(false)}
						className={css({
							display: { base: "block", lg: "none" },
							position: "fixed",
							inset: "0",
							zIndex: "99",
							bg: "rgba(0, 0, 0, 0.2)",
							border: "none",
							cursor: "default",
						})}
					/>
					<div
						className={css({
							display: { base: "block", lg: "none" },
							position: "fixed",
							top: "5rem",
							right: { base: "1rem", md: "1.5rem" },
							width: "min(260px, calc(100vw - 2rem))",
							zIndex: "100",
							bg: "#FFFFFF",
							borderRadius: "1.25rem",
							boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
							p: "1rem",
						})}
					>
						<nav className={css({ display: "flex", flexDirection: "column" })}>
							{links.map((link, index) => (
								<Link
									key={link.id}
									to={link.url}
									onClick={() => setMenuOpen(false)}
									className={css({
										py: "0.75rem",
										fontWeight: "bold",
										fontSize: "md",
										color: "gray.800",
										textDecoration: "none",
										borderTop: index === 0 ? "none" : "1px solid token(colors.gray.100)",
										transition: "color 0.15s ease",
										_hover: { color: "green.600" },
									})}
								>
									{link.title}
								</Link>
							))}
						</nav>
					</div>
				</>
			)}
		</>
	);
}
