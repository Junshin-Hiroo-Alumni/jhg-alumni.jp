import { IconChevronRight, IconHelpCircle, IconKey } from "@tabler/icons-react";
import type { ComponentType } from "react";
import { Link } from "react-router";
import { css } from "styled-system/css";
import { CONTACT_FORM_URL } from "~/lib/contact";

// ローディングアニメーション（約1.2s）が終わってから表示する
const START_DELAY = "1.2s";

const cardClass = css({
	display: "grid",
	gridTemplateColumns: "auto 1fr auto",
	alignItems: "center",
	gap: { base: "0.875rem", md: "1rem" },
	px: { base: "1rem", md: "1.25rem" },
	py: { base: "0.875rem", md: "1.125rem" },
	borderRadius: "1rem",
	boxShadow: "0 12px 32px rgba(0, 0, 0, 0.25)",
	textDecoration: "none",
	transition: "transform 0.2s ease, background-color 0.2s ease",
	bg: "white",
	color: "gray.900",
	_hover: { bg: "gray.50", transform: "translateY(-2px)" },
	_focusVisible: { outline: "3px solid token(colors.green.600)", outlineOffset: "3px" },
});

function CardContent({
	icon: Icon,
	title,
	description,
	primary,
}: {
	icon: ComponentType<{ size?: number; stroke?: number }>;
	title: string;
	description: string;
	primary: boolean;
}) {
	return (
		<>
			<span
				className={css({
					display: "grid",
					placeItems: "center",
					width: { base: "2.75rem", md: "3.25rem" },
					height: { base: "2.75rem", md: "3.25rem" },
					borderRadius: "9999px",
					bg: primary ? "green.600" : "gray.100",
					color: primary ? "white" : "gray.700",
				})}
			>
				<Icon size={26} stroke={1.8} />
			</span>
			<span>
				<span
					className={css({
						display: "block",
						fontSize: { base: "md", md: "lg" },
						fontWeight: "bold",
						lineHeight: "1.4",
					})}
				>
					{title}
				</span>
				{/* スマートフォンでは折り返してカードが高くなり、ヒーローの文字に重なるため出さない */}
				<span
					className={css({
						display: { base: "none", sm: "block" },
						mt: "0.125rem",
						fontSize: "xs",
						lineHeight: "1.6",
						color: "gray.600",
					})}
				>
					{description}
				</span>
			</span>
			<span className={css({ color: primary ? "green.600" : "gray.500" })}>
				<IconChevronRight size={22} stroke={2.2} />
			</span>
		</>
	);
}

/** トップのヒーロー上に重ねる、会員登録とログインの問い合わせへの導線 */
export default function MemberActions() {
	return (
		<nav
			aria-label="会員の方へ"
			className={css({
				position: "absolute",
				zIndex: 20,
				left: { base: "1rem", md: "auto" },
				right: { base: "1rem", md: "2rem" },
				bottom: { base: "1rem", md: "2rem" },
				width: { md: "26rem" },
				display: "grid",
				gap: { base: "0.625rem", md: "0.875rem" },
				animationName: "fadeInText",
				animationDuration: "0.8s",
				animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
				animationFillMode: "both",
			})}
			style={{ animationDelay: START_DELAY }}
		>
			<Link to="/register" className={cardClass}>
				<CardContent
					icon={IconKey}
					title="会員向けコード認証はこちら"
					description="お届けした認証コードで会員登録ができます"
					primary
				/>
			</Link>
			<a href={CONTACT_FORM_URL} target="_blank" rel="noopener noreferrer" className={cardClass}>
				<CardContent
					icon={IconHelpCircle}
					title="ログインのトラブル"
					description="ログインできない・コードが分からない方はお問い合わせください"
					primary={false}
				/>
			</a>
		</nav>
	);
}
