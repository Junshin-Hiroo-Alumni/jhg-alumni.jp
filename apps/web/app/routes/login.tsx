import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	errorClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	textLinkClass,
} from "~/components/auth/styles";
import { createApiClient } from "~/lib/api.server";
import { buildMeta } from "~/lib/seo";
import { authCookieHeaders, hasSession } from "~/lib/session.server";
import type { Route } from "./+types/login";

export function meta() {
	return buildMeta({ title: "ログイン", path: "/login", noindex: true });
}

export function loader({ request }: Route.LoaderArgs) {
	if (hasSession(request)) {
		throw redirect("/mypage");
	}
	return null;
}

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData();
	const res = await createApiClient(request).v1.auth.login.$post({
		json: { email: String(form.get("email") ?? ""), password: String(form.get("password") ?? "") },
	});
	if (res.status === 200) {
		return redirect("/mypage", { headers: authCookieHeaders(await res.json()) });
	}
	if (res.status === 401 || res.status === 429) {
		return { error: (await res.json()).message };
	}
	return { error: "エラーが発生しました。時間をおいて、もう一度お試しください。" };
}

export default function Login({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	return (
		<AuthShell title="ログイン">
			<Form method="post" className={css({ display: "grid", gap: "1.25rem" })}>
				<div>
					<label htmlFor="email" className={labelClass}>
						メールアドレス
					</label>
					<input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						required
						className={inputClass}
					/>
				</div>
				<div>
					<label htmlFor="password" className={labelClass}>
						パスワード
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="current-password"
						required
						className={inputClass}
					/>
					<div
						className={css({
							display: "flex",
							flexDirection: "column",
							alignItems: "flex-end",
							gap: "0.375rem",
							mt: "0.625rem",
							fontSize: "xs",
						})}
					>
						<Link to="/forgot-password" className={textLinkClass}>
							パスワードを忘れた場合
						</Link>
						<Link to="/register" className={textLinkClass}>
							アカウントをお持ちでない方
						</Link>
					</div>
				</div>
				{actionData?.error && (
					<p role="alert" className={errorClass}>
						{actionData.error}
					</p>
				)}
				<button type="submit" disabled={navigation.state !== "idle"} className={primaryButtonClass}>
					ログイン
				</button>
			</Form>
		</AuthShell>
	);
}
