import { IconMailForward } from "@tabler/icons-react";
import { Form, Link, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	inputClass,
	labelClass,
	primaryButtonStyle,
	textLinkClass,
} from "~/components/auth/styles";
import { createApiClient } from "~/lib/api.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/forgot-password";

export function meta() {
	return buildMeta({ title: "パスワードの再設定", path: "/forgot-password", noindex: true });
}

export async function action({ request }: Route.ActionArgs) {
	const email = String((await request.formData()).get("email") ?? "");
	const res = await createApiClient(request).v1.auth["password-reset"].$post({ json: { email } });
	if (res.status === 202) {
		return { sentTo: email };
	}
	if (res.status === 429) {
		return { error: (await res.json()).message };
	}
	return { error: "メールアドレスの形式が正しくありません。" };
}

export default function ForgotPassword({ actionData }: Route.ComponentProps) {
	const navigation = useNavigation();

	if (actionData && "sentTo" in actionData) {
		return (
			<AuthShell title="メールを確認してください">
				<div className={css({ textAlign: "center" })}>
					<IconMailForward
						size={56}
						stroke={1.5}
						className={css({ color: "green.500", mx: "auto", mb: "1.25rem" })}
					/>
					<p className={css({ fontWeight: "bold", color: "#222222", wordBreak: "break-all" })}>
						{actionData.sentTo}
					</p>
					<p className={css(bodyTextStyle, { mt: "1rem", mb: "2rem" })}>
						登録されているメールアドレスの場合、パスワード再設定用のリンクをお送りしました。リンクの有効期限は1時間です。
					</p>
					<Link to="/login" className={textLinkClass}>
						ログイン画面に戻る
					</Link>
				</div>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="パスワードの再設定">
			<p className={css(bodyTextStyle, { mb: "1.75rem" })}>
				登録したメールアドレスを入力してください。パスワード再設定用のリンクをお送りします。
			</p>
			<Form method="post">
				<label htmlFor="email" className={labelClass}>
					メールアドレス
				</label>
				<input
					id="email"
					name="email"
					type="email"
					autoComplete="email"
					required
					aria-invalid={actionData?.error ? true : undefined}
					className={inputClass}
				/>
				{actionData?.error && (
					<p role="alert" className={errorClass}>
						{actionData.error}
					</p>
				)}
				<button
					type="submit"
					disabled={navigation.state !== "idle"}
					className={css(primaryButtonStyle, { mt: "1.75rem" })}
				>
					再設定メールを送信
				</button>
			</Form>
			<p className={css({ mt: "1.5rem", textAlign: "center", fontSize: "sm" })}>
				<Link to="/login" className={textLinkClass}>
					ログイン画面に戻る
				</Link>
			</p>
		</AuthShell>
	);
}
