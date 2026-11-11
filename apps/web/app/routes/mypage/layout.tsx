import { IconArrowLeft, IconLogout, IconMenu2, IconUser, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Form, Link, NavLink, Outlet, redirect, useLocation, useMatches } from "react-router";
import { css } from "styled-system/css";
import { createApiClient } from "~/lib/api.server";
import {
	clearAuthCookieHeaders,
	memberSessionContext,
	requireMemberSession,
} from "~/lib/session.server";
import type { Route } from "./+types/layout";

/** サイドバーのメニュー。機能を増やすときはここに追加する */
const navGroups = [
	{
		label: "アカウント",
		items: [{ to: "/mypage/profile", label: "プロフィール設定", icon: IconUser }],
	},
];

/** 各ページが `handle` で宣言する、上部バーと見出しの情報 */
export type MyPageHandle = { title: string; description?: string };

export const middleware = [requireMemberSession];

export async function loader({ request, context }: Route.LoaderArgs) {
	const { accessToken } = context.get(memberSessionContext);
	const res = await createApiClient(request, { accessToken }).v1.me.$get();
	if (res.status !== 200) {
		throw redirect("/login", { headers: clearAuthCookieHeaders() });
	}
	return { member: await res.json() };
}

export type MyPageOutletContext = {
	member: Awaited<ReturnType<typeof loader>>["member"];
};

const SIDEBAR_WIDTH = "248px";

const navItemClass = css({
	display: "flex",
	alignItems: "center",
	gap: "0.625rem",
	height: "2.25rem",
	px: "0.75rem",
	borderRadius: "0.375rem",
	fontSize: "sm",
	fontWeight: "500",
	color: "gray.700",
	transition: "background-color 0.15s ease, color 0.15s ease",
	_hover: { bg: "gray.100", color: "gray.900" },
	"&[aria-current='page']": { bg: "green.50", color: "green.700", fontWeight: "bold" },
});

function usePageHandle(): MyPageHandle | undefined {
	const matches = useMatches();
	for (const match of [...matches].reverse()) {
		const handle = match.handle as MyPageHandle | undefined;
		if (handle?.title) {
			return handle;
		}
	}
	return undefined;
}

function Sidebar({ member }: MyPageOutletContext) {
	return (
		<div className={css({ display: "flex", flexDirection: "column", height: "100%" })}>
			<Link
				to="/"
				className={css({
					display: "flex",
					alignItems: "center",
					gap: "0.625rem",
					height: "4rem",
					px: "1.25rem",
					borderBottom: "1px solid token(colors.gray.200)",
					flexShrink: 0,
				})}
			>
				<img src="/common/base-logo.svg" alt="" className={css({ width: "28px" })} />
				<span className={css({ lineHeight: "1.3" })}>
					<span className={css({ display: "block", fontSize: "xs", color: "gray.500" })}>
						順心広尾学園同窓会
					</span>
					<span className={css({ display: "block", fontSize: "sm", fontWeight: "bold" })}>
						会員マイページ
					</span>
				</span>
			</Link>

			<nav
				aria-label="マイページのメニュー"
				className={css({ flex: "1", overflowY: "auto", p: "0.75rem" })}
			>
				{navGroups.map(group => (
					<div key={group.label} className={css({ mb: "1rem" })}>
						<p
							className={css({
								px: "0.75rem",
								mb: "0.375rem",
								fontSize: "xs",
								fontWeight: "bold",
								color: "gray.500",
							})}
						>
							{group.label}
						</p>
						{group.items.map(item => (
							<NavLink key={item.to} to={item.to} className={navItemClass}>
								<item.icon size={18} stroke={1.75} />
								{item.label}
							</NavLink>
						))}
					</div>
				))}
			</nav>

			<div className={css({ borderTop: "1px solid token(colors.gray.200)", p: "0.75rem" })}>
				<Link to="/" className={navItemClass}>
					<IconArrowLeft size={18} stroke={1.75} />
					サイトに戻る
				</Link>
				<div
					className={css({
						display: "flex",
						alignItems: "center",
						gap: "0.625rem",
						mt: "0.5rem",
						p: "0.5rem",
						borderRadius: "0.5rem",
						bg: "gray.50",
					})}
				>
					<span
						aria-hidden
						className={css({
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "2rem",
							height: "2rem",
							borderRadius: "9999px",
							bg: "green.600",
							color: "#FFFFFF",
							fontSize: "sm",
							fontWeight: "bold",
							flexShrink: 0,
						})}
					>
						{member.name.slice(0, 1)}
					</span>
					<span className={css({ minWidth: 0, flex: "1", lineHeight: "1.3" })}>
						<span
							className={css({
								display: "block",
								fontSize: "sm",
								fontWeight: "bold",
								truncate: true,
							})}
						>
							{member.name}
						</span>
						<span
							className={css({
								display: "block",
								fontSize: "xs",
								color: "gray.500",
								truncate: true,
							})}
						>
							{member.email}
						</span>
					</span>
					<Form method="post" action="/logout">
						<button
							type="submit"
							aria-label="ログアウト"
							title="ログアウト"
							className={css({
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "2rem",
								height: "2rem",
								borderRadius: "0.375rem",
								bg: "transparent",
								border: "none",
								color: "gray.500",
								cursor: "pointer",
								_hover: { bg: "gray.200", color: "red.600" },
							})}
						>
							<IconLogout size={18} stroke={1.75} />
						</button>
					</Form>
				</div>
			</div>
		</div>
	);
}

export default function MyPageLayout({ loaderData }: Route.ComponentProps) {
	const { member } = loaderData;
	const page = usePageHandle();
	const { pathname } = useLocation();
	const [menuOpen, setMenuOpen] = useState(false);

	// スマホでメニューからページを移動したら閉じる
	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname の変化をきっかけにする
	useEffect(() => {
		setMenuOpen(false);
	}, [pathname]);

	return (
		<div className={css({ minHeight: "100dvh", bg: "#F5F7FA", color: "gray.900" })}>
			{/* サイドバー（PC は常に表示、スマホは開閉） */}
			<aside
				data-open={menuOpen}
				className={css({
					position: "fixed",
					insetY: "0",
					left: "0",
					zIndex: "50",
					width: SIDEBAR_WIDTH,
					bg: "#FFFFFF",
					borderRight: "1px solid token(colors.gray.200)",
					transform: { base: "translateX(-100%)", lg: "none" },
					transition: "transform 0.2s ease",
					"&[data-open='true']": { transform: "none" },
				})}
			>
				<Sidebar member={member} />
			</aside>
			{menuOpen && (
				<button
					type="button"
					aria-label="メニューを閉じる"
					onClick={() => setMenuOpen(false)}
					className={css({
						display: { lg: "none" },
						position: "fixed",
						inset: "0",
						zIndex: "40",
						bg: "rgba(0, 0, 0, 0.3)",
						border: "none",
					})}
				/>
			)}

			<div className={css({ pl: { lg: SIDEBAR_WIDTH } })}>
				<header
					className={css({
						position: "sticky",
						top: "0",
						zIndex: "30",
						display: "flex",
						alignItems: "center",
						gap: "0.75rem",
						height: "4rem",
						px: { base: "1rem", md: "2rem" },
						bg: "#FFFFFF",
						borderBottom: "1px solid token(colors.gray.200)",
					})}
				>
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
							borderRadius: "0.375rem",
							bg: "transparent",
							border: "1px solid token(colors.gray.200)",
							cursor: "pointer",
						})}
					>
						{menuOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
					</button>
					<nav aria-label="パンくずリスト" className={css({ fontSize: "sm", color: "gray.500" })}>
						<Link to="/mypage" className={css({ _hover: { color: "gray.900" } })}>
							マイページ
						</Link>
						{page && (
							<>
								<span className={css({ mx: "0.5rem" })}>/</span>
								<span className={css({ color: "gray.900", fontWeight: "500" })}>{page.title}</span>
							</>
						)}
					</nav>
				</header>

				<main
					className={css({
						maxW: "960px",
						px: { base: "1rem", md: "2rem" },
						py: { base: "1.5rem", md: "2rem" },
					})}
				>
					{page && (
						<div className={css({ mb: "1.5rem" })}>
							<h1 className={css({ fontSize: { base: "xl", md: "2xl" }, fontWeight: "bold" })}>
								{page.title}
							</h1>
							{page.description && (
								<p className={css({ mt: "0.375rem", fontSize: "sm", color: "gray.600" })}>
									{page.description}
								</p>
							)}
						</div>
					)}
					<Outlet context={{ member } satisfies MyPageOutletContext} />
				</main>
			</div>
		</div>
	);
}
