import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	hintClass,
	inputClass,
	labelClass,
	primaryButtonClass,
	primaryButtonStyle,
} from "~/components/auth/styles";
import { createApiClient } from "~/lib/api.server";
import { clearTicketCookie } from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import { authCookieHeaders } from "~/lib/session.server";
import type { Route } from "./+types/verify";

const MIN_PASSWORD_LENGTH = 8;

export function meta() {
	return buildMeta({ title: "パスワードの設定", path: "/register/verify", noindex: true });
}

function getToken(request: Request): string {
	return new URL(request.url).searchParams.get("token") ?? "";
}

export async function loader({ request }: Route.LoaderArgs) {
	const token = getToken(request);
	if (!token) {
		return { valid: false as const };
	}
	const res = await createApiClient(request).v1.registrations.verification.$get({
		query: { token },
	});
	if (res.status !== 200) {
		return { valid: false as const };
	}
	const { email } = await res.json();
	return { valid: true as const, email };
}

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData();
	const password = String(form.get("password") ?? "");
	if (password.length < MIN_PASSWORD_LENGTH) {
		return { error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください。` };
	}
	if (password !== form.get("passwordConfirm")) {
		return { error: "確認用のパスワードが一致しません。" };
	}

	const res = await createApiClient(request).v1.registrations.verification.$post({
		json: { token: getToken(request), password },
	});
	if (res.status === 201) {
		const headers = authCookieHeaders(await res.json());
		headers.append("Set-Cookie", clearTicketCookie());
		return redirect("/mypage", { headers });
	}
	if (res.status === 404 || res.status === 409) {
		return { error: (await res.json()).message };
	}
	return { error: "パスワードは8〜128文字で設定してください。" };
}

export default function RegisterVerify({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();

	if (!loaderData.valid) {
		return (
			<AuthShell title="リンクが無効です" step="password">
				<p className={css(bodyTextStyle, { mb: "1.75rem", textAlign: "center" })}>
					リンクが無効か、有効期限（24時間）が切れています。お手数ですが、認証コードの入力からやり直してください。
				</p>
				<Link to="/register" className={primaryButtonClass}>
					会員登録に戻る
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="パスワードの設定" step="password">
			<p className={css(bodyTextStyle, { mb: "1.75rem" })}>
				メールアドレスの確認が完了しました。最後に、ログイン用のパスワードを設定してください。
			</p>
			<Form method="post" className={css({ display: "grid", gap: "1.25rem" })}>
				{/* パスワードマネージャーにメールアドレスと紐づけて保存させる */}
				<input
					type="email"
					name="email"
					autoComplete="username"
					value={loaderData.email}
					readOnly
					hidden
				/>
				<div>
					<label htmlFor="password" className={labelClass}>
						パスワード
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autoComplete="new-password"
						minLength={MIN_PASSWORD_LENGTH}
						maxLength={128}
						required
						className={inputClass}
					/>
					<p className={hintClass}>{MIN_PASSWORD_LENGTH}文字以上で設定してください。</p>
				</div>
				<div>
					<label htmlFor="passwordConfirm" className={labelClass}>
						パスワード（確認）
					</label>
					<input
						id="passwordConfirm"
						name="passwordConfirm"
						type="password"
						autoComplete="new-password"
						required
						className={inputClass}
					/>
				</div>
				{actionData?.error && (
					<p role="alert" className={errorClass}>
						{actionData.error}
					</p>
				)}
				<button
					type="submit"
					disabled={navigation.state !== "idle"}
					className={css(primaryButtonStyle, { mt: "0.5rem" })}
				>
					登録を完了する
				</button>
			</Form>
		</AuthShell>
	);
}
