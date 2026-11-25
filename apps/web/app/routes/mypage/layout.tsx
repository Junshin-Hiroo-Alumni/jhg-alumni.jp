import { IconMenu2, IconX } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Outlet, redirect, useLocation, useMatches } from "react-router";
import { css } from "styled-system/css";
import { Sidebar } from "~/components/mypage/Sidebar";
import { createApiClient } from "~/lib/api.server";
import {
	clearAuthCookieHeaders,
	memberSessionContext,
	requireMemberSession,
} from "~/lib/session.server";
import type { Route } from "./+types/layout";

/** 各ページが `handle` で宣言する、見出しの情報 */
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

const SIDEBAR_WIDTH = "16.5rem";

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

/** スマホのメニューの開閉。開いている間は背面のスクロールを止め、Esc とページ移動で閉じる */
function useMenuDrawer() {
	const { pathname } = useLocation();
	const [open, setOpen] = useState(false);

	// biome-ignore lint/correctness/useExhaustiveDependencies: pathname の変化をきっかけにする
	useEffect(() => {
		setOpen(false);
	}, [pathname]);

	useEffect(() => {
		if (!open) return;
		const close = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
		const { overflow } = document.body.style;
		document.body.style.overflow = "hidden";
		window.addEventListener("keydown", close);
		return () => {
			document.body.style.overflow = overflow;
			window.removeEventListener("keydown", close);
		};
	}, [open]);

	return [open, setOpen] as const;
}

function PageHeader({
	page,
	menuOpen,
	onToggleMenu,
}: {
	page: MyPageHandle | undefined;
	menuOpen: boolean;
	onToggleMenu: () => void;
}) {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "0.75rem",
				mb: { base: "1.25rem", md: "2rem" },
			})}
		>
			<button
				type="button"
				aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
				aria-expanded={menuOpen}
				onClick={onToggleMenu}
				className={css({
					display: { base: "flex", lg: "none" },
					alignItems: "center",
					justifyContent: "center",
					width: "2.25rem",
					height: "2.25rem",
					flexShrink: 0,
					borderRadius: "0.5rem",
					bg: "white",
					border: "1px solid token(colors.mypage.line)",
					cursor: "pointer",
				})}
			>
				{menuOpen ? <IconX size={18} /> : <IconMenu2 size={18} />}
			</button>
			{page && (
				<div>
					<h1
						className={css({
							fontSize: { base: "xl", md: "2xl" },
							fontWeight: "bold",
							letterSpacing: "0.02em",
						})}
					>
						{page.title}
					</h1>
					{page.description && (
						<p className={css({ mt: "0.25rem", fontSize: "sm", color: "gray.600" })}>
							{page.description}
						</p>
					)}
				</div>
			)}
		</div>
	);
}

export default function MyPageLayout({ loaderData }: Route.ComponentProps) {
	const { member } = loaderData;
	const page = usePageHandle();
	const [menuOpen, setMenuOpen] = useMenuDrawer();

	return (
		<div className={css({ minHeight: "100dvh", bg: "mypage.bg", color: "gray.900" })}>
			{/* PC は左に固定、スマホは開閉するドロワー */}
			<aside
				data-open={menuOpen}
				className={css({
					position: "fixed",
					insetY: "0",
					left: "0",
					zIndex: "50",
					width: SIDEBAR_WIDTH,
					bg: "white",
					borderRight: "1px solid token(colors.mypage.line)",
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

			<main className={css({ pl: { lg: SIDEBAR_WIDTH } })}>
				<div
					className={css({
						maxW: "52rem",
						mx: "auto",
						px: { base: "1.25rem", md: "2.5rem" },
						py: { base: "1.25rem", md: "2.5rem" },
					})}
				>
					<PageHeader
						page={page}
						menuOpen={menuOpen}
						onToggleMenu={() => setMenuOpen(open => !open)}
					/>
					<Outlet context={{ member } satisfies MyPageOutletContext} />
				</div>
			</main>
		</div>
	);
}
