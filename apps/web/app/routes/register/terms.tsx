import ReactMarkdown from "react-markdown";
import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	primaryButtonClass,
	secondaryButtonClass,
	textLinkClass,
} from "~/components/auth/styles";
import {
	abandonRegistrationHeaders,
	requireRegistrationStage,
	termsAgreedCookie,
} from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/terms";

const documents = import.meta.glob("../../content/terms/{service,privacy}.md", {
	query: "?raw",
	import: "default",
	eager: true,
}) as Record<string, string>;

const serviceMarkdown = documents["../../content/terms/service.md"] ?? "";
const privacyMarkdown = documents["../../content/terms/privacy.md"] ?? "";

export function meta() {
	return buildMeta({ title: "規約への同意", path: "/register/terms", noindex: true });
}

export async function loader({ request }: Route.LoaderArgs) {
	await requireRegistrationStage(request, ["confirmed"]);
	return null;
}

export async function action({ request }: Route.ActionArgs) {
	if ((await request.formData()).get("intent") === "decline") {
		return redirect("/", { headers: abandonRegistrationHeaders() });
	}
	await requireRegistrationStage(request, ["confirmed"]);
	return redirect("/register/email", { headers: { "Set-Cookie": termsAgreedCookie(request) } });
}

const documentClass = css({
	fontSize: "xs",
	lineHeight: "1.8",
	color: "gray.700",
	"& h1": { fontSize: "sm", fontWeight: "bold", color: "gray.900", mb: "0.75rem" },
	"& h2": { fontSize: "xs", fontWeight: "bold", color: "gray.900", mt: "1.25rem", mb: "0.25rem" },
	"& h3": { fontWeight: "bold", mt: "1rem" },
	"& p": { my: "0.5rem" },
	"& ul": { pl: "1.25rem", my: "0.5rem", listStyleType: "disc" },
	"& ol": { pl: "1.25rem", my: "0.5rem", listStyleType: "decimal" },
	"& a": { color: "green.700", textDecoration: "underline" },
	"& strong": { fontWeight: "bold" },
	"& + &": { mt: "2rem", pt: "1.5rem", borderTop: "1px solid token(colors.gray.200)" },
});

export default function RegisterTerms() {
	const navigation = useNavigation();
	const busy = navigation.state !== "idle";
	return (
		<AuthShell title="規約への同意" step="terms">
			<p className={css(bodyTextStyle, { mb: "1.25rem" })}>
				登録を続ける前に、利用規約とプライバシーポリシーをお読みください。
			</p>
			<section
				aria-label="利用規約とプライバシーポリシー"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: スクロール領域をキーボードでも読めるようにする
				tabIndex={0}
				className={css({
					maxH: { base: "20rem", lg: "16rem" },
					overflowY: "auto",
					p: "1.25rem",
					borderRadius: "0.5rem",
					border: "1px solid token(colors.gray.200)",
					bg: "gray.50",
					_focusVisible: { outline: "2px solid token(colors.green.500)", outlineOffset: "2px" },
				})}
			>
				<div className={documentClass}>
					<ReactMarkdown>{serviceMarkdown}</ReactMarkdown>
				</div>
				<div className={documentClass}>
					<ReactMarkdown>{privacyMarkdown}</ReactMarkdown>
				</div>
			</section>
			<p className={css({ mt: "0.625rem", fontSize: "xs", color: "gray.500", textAlign: "right" })}>
				別のタブで読む:{" "}
				<Link to="/terms/service" target="_blank" rel="noopener" className={textLinkClass}>
					利用規約
				</Link>
				{" / "}
				<Link to="/terms/privacy" target="_blank" rel="noopener" className={textLinkClass}>
					プライバシーポリシー
				</Link>
			</p>
			<Form method="post" className={css({ display: "grid", gap: "0.75rem", mt: "1.75rem" })}>
				<button
					type="submit"
					name="intent"
					value="agree"
					disabled={busy}
					className={primaryButtonClass}
				>
					同意して次へ
				</button>
				<button
					type="submit"
					name="intent"
					value="decline"
					disabled={busy}
					formNoValidate
					className={secondaryButtonClass}
				>
					同意しない
				</button>
				<p className={css({ fontSize: "xs", color: "gray.500", textAlign: "center" })}>
					同意しない場合は登録を中止し、トップページに戻ります。
				</p>
			</Form>
		</AuthShell>
	);
}
