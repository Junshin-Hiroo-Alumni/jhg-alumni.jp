import {
	type Icon,
	IconLock,
	IconLogout,
	IconNotebook,
	IconUser,
	IconUsersGroup,
} from "@tabler/icons-react";
import { Form, NavLink } from "react-router";
import { css } from "styled-system/css";
import { formatGraduationYear } from "~/lib/graduation-year";

/** `to` がない項目は実装予定の機能として、鍵付きで押せない状態で表示する */
type NavItem = { label: string; icon: Icon; to?: string };

/** サイドバーのメニュー。機能を増やすときはここに追加する */
const navGroups: { label: string; items: NavItem[] }[] = [
	{
		label: "会員サービス",
		items: [
			{ label: "卒業生ジャーナル", icon: IconNotebook },
			{ label: "会員交流", icon: IconUsersGroup },
		],
	},
	{
		label: "アカウント",
		items: [{ to: "/mypage/profile", label: "プロフィール設定", icon: IconUser }],
	},
];

type SidebarMember = { name: string; graduationYear: number | null };

const navItemBaseStyle = css.raw({
	display: "flex",
	alignItems: "center",
	gap: "0.625rem",
	width: "100%",
	position: "relative",
	height: "2.5rem",
	px: "0.75rem",
	borderRadius: "0.5rem",
	bg: "transparent",
	border: "none",
	fontSize: "sm",
	fontWeight: "500",
	textAlign: "left",
	whiteSpace: "nowrap",
	// 和文フォントは字面がボックスの中央より上に寄るため、アイコンも少し上げて字面の中央にそろえる
	"& > svg": { flexShrink: 0, transform: "translateY(-0.1em)" },
});

const navItemClass = css(navItemBaseStyle, {
	color: "gray.700",
	cursor: "pointer",
	transition: "background-color 0.15s ease, color 0.15s ease",
	"& > svg": { color: "gray.500" },
	_hover: { bg: "gray.100", color: "gray.900" },
	_focusVisible: { outline: "2px solid token(colors.green.500)", outlineOffset: "-2px" },
	"&[aria-current='page']": {
		bg: "green.50",
		color: "green.800",
		fontWeight: "bold",
		"& > svg": { color: "green.600" },
	},
});

const lockedNavItemClass = css(navItemBaseStyle, { color: "gray.400", cursor: "not-allowed" });

function NavItemLink({ item }: { item: NavItem }) {
	if (item.to) {
		return (
			<NavLink to={item.to} className={navItemClass}>
				<item.icon size={18} stroke={1.75} />
				{item.label}
			</NavLink>
		);
	}
	return (
		<span aria-disabled="true" className={lockedNavItemClass}>
			<item.icon size={18} stroke={1.75} />
			{item.label}
			<IconLock size={14} stroke={2} aria-label="準備中" className={css({ ml: "auto" })} />
		</span>
	);
}

function MemberBadge({ member }: { member: SidebarMember }) {
	return (
		<div
			className={css({
				display: "flex",
				alignItems: "center",
				gap: "0.625rem",
				px: "0.5rem",
				py: "0.5rem",
				mb: "0.25rem",
			})}
		>
			<span
				aria-hidden
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					width: "2.25rem",
					height: "2.25rem",
					borderRadius: "9999px",
					bg: "green.100",
					color: "green.700",
					fontSize: "sm",
					fontWeight: "bold",
					flexShrink: 0,
				})}
			>
				{member.name.slice(0, 1)}
			</span>
			<span className={css({ minWidth: 0, flex: "1", lineHeight: "1.35" })}>
				<span
					className={css({ display: "block", fontSize: "sm", fontWeight: "bold", truncate: true })}
				>
					{member.name}
				</span>
				<span
					className={css({ display: "block", fontSize: "xs", color: "gray.500", truncate: true })}
				>
					{formatGraduationYear(member.graduationYear)}
				</span>
			</span>
		</div>
	);
}

export function Sidebar({ member }: { member: SidebarMember }) {
	return (
		<div
			className={css({
				display: "flex",
				flexDirection: "column",
				height: "100%",
				px: "0.75rem",
				pt: { base: "1.25rem", md: "2.5rem" },
				pb: "0.75rem",
			})}
		>
			<nav
				aria-label="マイページのメニュー"
				className={css({
					flex: "1",
					display: "grid",
					alignContent: "start",
					gap: "1.5rem",
					overflowY: "auto",
				})}
			>
				{navGroups.map(group => (
					<div key={group.label} className={css({ display: "grid", gap: "0.25rem" })}>
						<p
							className={css({
								px: "0.75rem",
								mb: "0.25rem",
								fontSize: "0.6875rem",
								fontWeight: "bold",
								letterSpacing: "0.08em",
								color: "gray.400",
							})}
						>
							{group.label}
						</p>
						{group.items.map(item => (
							<NavItemLink key={item.label} item={item} />
						))}
					</div>
				))}
			</nav>

			<div
				className={css({
					mt: "0.75rem",
					pt: "0.75rem",
					borderTop: "1px solid token(colors.mypage.line)",
				})}
			>
				<MemberBadge member={member} />
				<Form method="post" action="/logout">
					<button type="submit" className={navItemClass}>
						<IconLogout size={18} stroke={1.75} />
						ログアウト
					</button>
				</Form>
			</div>
		</div>
	);
}
