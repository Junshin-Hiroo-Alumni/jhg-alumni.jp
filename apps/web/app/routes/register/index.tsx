import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	inputStyle,
	labelClass,
	primaryButtonStyle,
	secondaryButtonClass,
	textLinkClass,
} from "~/components/auth/styles";
import TermsDocuments from "~/components/auth/TermsDocuments";
import { createApiClient } from "~/lib/api.server";
import { formatMemberCode, isCompleteMemberCode, normalizeMemberCode } from "~/lib/member-code";
import { clearTicketCookie, ticketCookieHeaders } from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import { hasSession } from "~/lib/session.server";
import type { Route } from "./+types/index";

export function meta() {
	return buildMeta({ title: "会員登録", path: "/register", noindex: true });
}

export function loader({ request }: Route.LoaderArgs) {
	if (hasSession(request)) {
		throw redirect("/mypage");
	}
	return { expired: new URL(request.url).searchParams.has("expired") };
}

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData();
	if (form.get("intent") === "decline") {
		return redirect("/", { headers: { "Set-Cookie": clearTicketCookie() } });
	}
	const code = normalizeMemberCode(String(form.get("code") ?? ""));
	const res = await createApiClient(request).v1.registrations.$post({ json: { code } });
	if (res.status === 201) {
		const { ticket } = await res.json();
		return redirect("/register/graduation-year", { headers: ticketCookieHeaders(ticket) });
	}
	if (res.status === 404 || res.status === 409 || res.status === 429) {
		return { error: (await res.json()).message };
	}
	return { error: "エラーが発生しました。時間をおいて、もう一度お試しください。" };
}

export default function RegisterCode({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const busy = navigation.state !== "idle";
	const [code, setCode] = useState("");

	return (
		<AuthShell title="会員登録" step="code">
			<Form method="post">
				<label htmlFor="code" className={labelClass}>
					認証コード
				</label>
				<input
					id="code"
					name="code"
					inputMode="text"
					autoComplete="off"
					autoCapitalize="characters"
					spellCheck={false}
					placeholder="XXXX-XXXX-XXXX"
					value={formatMemberCode(code)}
					onChange={event => setCode(normalizeMemberCode(event.target.value))}
					aria-invalid={actionData?.error ? true : undefined}
					className={css(inputStyle, {
						textAlign: "center",
						fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
						fontSize: "1.5rem",
						fontWeight: "bold",
						color: "#222222",
						letterSpacing: "0.15em",
						height: "3.75rem",
						_placeholder: { color: "gray.300" },
					})}
				/>
				{actionData?.error ? (
					<p role="alert" className={errorClass}>
						{actionData.error}
					</p>
				) : (
					loaderData.expired && (
						<p role="alert" className={errorClass}>
							登録の有効期限が切れました。お手数ですが、認証コードの入力からやり直してください。
						</p>
					)
				)}
				<div className={css({ mt: "1.75rem" })}>
					<p className={labelClass}>利用規約とプライバシーポリシー</p>
					<TermsDocuments />
				</div>
				<div className={css({ display: "grid", gap: "0.75rem", mt: "1.5rem" })}>
					<button
						type="submit"
						name="intent"
						value="agree"
						disabled={!isCompleteMemberCode(code) || busy}
						className={css(primaryButtonStyle)}
					>
						同意して次へ
					</button>
					<button
						type="submit"
						name="intent"
						value="decline"
						disabled={busy}
						className={secondaryButtonClass}
					>
						同意しない
					</button>
					<p className={css({ fontSize: "xs", color: "gray.500", textAlign: "center" })}>
						同意しない場合は登録を中止し、トップページに戻ります。
					</p>
				</div>
			</Form>

			<p className={css(bodyTextStyle, { mt: "2rem", textAlign: "center" })}>
				すでに登録済みの方は{" "}
				<Link to="/login" className={textLinkClass}>
					ログイン
				</Link>
			</p>
		</AuthShell>
	);
}
