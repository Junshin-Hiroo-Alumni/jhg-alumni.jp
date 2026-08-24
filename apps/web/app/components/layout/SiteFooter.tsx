import { IconBrandFacebook, IconBrandGithub, IconBrandInstagram } from "@tabler/icons-react";
import { Link } from "react-router";
import { css } from "styled-system/css";

const footerLinks = [
	{ id: "f-home", title: "ホーム", url: "/" },
	{ id: "f-news", title: "お知らせ", url: "/notice" },
	{ id: "f-board", title: "役員会", url: "/board-meeting" },
	{ id: "f-rules", title: "会則", url: "/code" },
	{ id: "f-gallery", title: "フォトギャラリー", url: "/gallery" },
];

const socialLinks = [
	{
		id: "s-instagram",
		label: "Instagram",
		url: "https://www.instagram.com/junshin_hiroo_alumni/",
		icon: IconBrandInstagram,
	},
	{
		id: "s-facebook",
		label: "Facebook",
		url: "https://www.facebook.com/junshin.hiroo/?locale=ja_JP",
		icon: IconBrandFacebook,
	},
	{
		id: "s-github",
		label: "GitHub（ソースコード）",
		url: "https://github.com/Junshin-Hiroo-Alumni/jhg-alumni.jp",
		icon: IconBrandGithub,
	},
];

export default function SiteFooter() {
	return (
		<footer
			className={css({
				bg: "#23362c",
				color: "#ffffff",
				px: { base: "1.5rem", md: "2rem" },
				pt: { base: "3rem", md: "4rem" },
				pb: "2rem",
			})}
		>
			<div
				className={css({
					maxW: "1080px",
					mx: "auto",
					w: "full",
					display: "grid",
					gridTemplateColumns: { base: "1fr", md: "1fr auto" },
					gap: { base: "2.5rem", md: "2rem" },
				})}
			>
				{/* 組織名・連絡先（差し替え用） */}
				<div>
					<div className={css({ display: "flex", alignItems: "center", gap: "0.75rem" })}>
						<img
							src="/common/base-logo.svg"
							alt=""
							aria-hidden="true"
							className={css({
								height: "36px",
								width: "auto",
								bg: "#ffffff",
								borderRadius: "0.5rem",
								p: "0.25rem",
							})}
						/>
						<span className={css({ fontWeight: "bold", fontSize: "1.125rem" })}>
							順心広尾学園同窓会
						</span>
					</div>
					<p
						className={css({
							mt: "1rem",
							fontSize: "sm",
							lineHeight: "1.9",
							color: "rgba(255, 255, 255, 0.75)",
						})}
					>
						〒106-0047 東京都港区南麻布5-1-14
						<br />
						<a href="https://www.hiroogakuen.ed.jp/">広尾学園公式サイト</a>
						<br />
						<a href="https://forms.gle/D9a2wzMiyJY3F3fNA">お問い合わせ</a>
					</p>

					{/* SNS / ソースコード */}
					<div className={css({ display: "flex", gap: "0.75rem", mt: "1.25rem" })}>
						{socialLinks.map(({ id, label, url, icon: Icon }) => (
							<a
								key={id}
								href={url}
								target="_blank"
								rel="noreferrer"
								aria-label={label}
								className={css({
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									width: "2.25rem",
									height: "2.25rem",
									borderRadius: "9999px",
									color: "#ffffff",
									bg: "rgba(255, 255, 255, 0.1)",
									transition: "background-color 0.15s ease",
									_hover: { bg: "rgba(255, 255, 255, 0.22)" },
								})}
							>
								<Icon size={20} stroke={1.75} />
							</a>
						))}
					</div>
				</div>

				{/* ナビゲーション */}
				<nav className={css({ display: "flex", flexDirection: "column", gap: "0.875rem" })}>
					{footerLinks.map(link => (
						<Link
							key={link.id}
							to={link.url}
							className={css({
								color: "rgba(255, 255, 255, 0.85)",
								fontSize: "sm",
								fontWeight: "bold",
								textDecoration: "none",
								transition: "color 0.15s ease",
								_hover: { color: "#ffffff" },
							})}
						>
							{link.title}
						</Link>
					))}
				</nav>
			</div>

			<div
				className={css({
					maxW: "1080px",
					mx: "auto",
					w: "full",
					mt: { base: "2.5rem", md: "3.5rem" },
					pt: "1.5rem",
					borderTop: "1px solid rgba(255, 255, 255, 0.15)",
					textAlign: "center",
					fontSize: "xs",
					color: "rgba(255, 255, 255, 0.6)",
				})}
			>
				© 2026順心広尾学園同窓会
			</div>
		</footer>
	);
}
