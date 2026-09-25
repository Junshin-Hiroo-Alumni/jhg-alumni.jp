import { Form, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	hintClass,
	inputClass,
	labelClass,
	primaryButtonStyle,
} from "~/components/auth/styles";
import {
	pathForStage,
	redirectToStart,
	registrationApi,
	requireRegistrationStage,
} from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/email";

export function meta() {
	return buildMeta({ title: "メールアドレスの登録", path: "/register/email", noindex: true });
}

export async function loader({ request }: Route.LoaderArgs) {
	// 確認メール送信後にアドレスを変更する場合も、この画面に戻ってくる
	const { email } = await requireRegistrationStage(request, ["quiz_passed", "email_sent"]);
	return { email };
}

export async function action({ request }: Route.ActionArgs) {
	const email = String((await request.formData()).get("email") ?? "");
	const res = await registrationApi(request).v1.registrations.current.email.$post({
		json: { email },
	});
	if (res.status === 202) {
		return redirect("/register/email-sent");
	}
	if (res.status === 409) {
		const body = await res.json();
		return body.stage ? redirect(pathForStage(body.stage)) : { error: body.message };
	}
	if (res.status === 404 || res.status === 429) {
		return { error: (await res.json()).message };
	}
	if (res.status === 401) {
		return redirectToStart();
	}
	return { error: "メールアドレスの形式が正しくありません。" };
}

export default function RegisterEmail({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	return (
		<AuthShell title="メールアドレスの登録" step="email">
			<p className={css(bodyTextStyle, { mb: "1.75rem" })}>
				クイズに全問正解しました。ログインに使うメールアドレスを入力してください。確認メールをお送りします。
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
					defaultValue={loaderData.email ?? undefined}
					required
					aria-invalid={actionData?.error ? true : undefined}
					className={inputClass}
				/>
				<p className={hintClass}>メールが届かない場合は、迷惑メールフォルダもご確認ください。</p>
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
					確認メールを送信
				</button>
			</Form>
		</AuthShell>
	);
}
