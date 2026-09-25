import { IconCircleCheck } from "@tabler/icons-react";
import { Form, Link, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	primaryButtonClass,
	primaryButtonStyle,
} from "~/components/auth/styles";
import { createApiClient } from "~/lib/api.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/verify-email";

export function meta() {
	return buildMeta({ title: "メールアドレスの変更", path: "/verify-email", noindex: true });
}

function getToken(request: Request): string {
	return new URL(request.url).searchParams.get("token") ?? "";
}

export async function loader({ request }: Route.LoaderArgs) {
	const token = getToken(request);
	if (!token) {
		return { valid: false as const };
	}
	const res = await createApiClient(request).v1["email-changes"].$get({ query: { token } });
	if (res.status !== 200) {
		return { valid: false as const };
	}
	return { valid: true as const, newEmail: (await res.json()).newEmail };
}

// メールのリンクを開いただけ（メールソフトの自動プレビューなど）では変更せず、ボタンで確定する
export async function action({ request }: Route.ActionArgs) {
	const res = await createApiClient(request).v1["email-changes"].confirm.$post({
		json: { token: getToken(request) },
	});
	if (res.status === 200) {
		return { done: true as const, email: (await res.json()).email };
	}
	if (res.status === 404 || res.status === 409) {
		return { done: false as const, error: (await res.json()).message };
	}
	return {
		done: false as const,
		error: "変更に失敗しました。時間をおいて、もう一度お試しください。",
	};
}

export default function VerifyEmail({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();

	if (actionData?.done) {
		return (
			<AuthShell title="メールアドレスを変更しました">
				<div className={css({ textAlign: "center" })}>
					<IconCircleCheck
						size={56}
						stroke={1.5}
						className={css({ color: "green.500", mx: "auto", mb: "1.25rem" })}
					/>
					<p className={css(bodyTextStyle, { mb: "2rem" })}>
						今後は <strong>{actionData.email}</strong> でログインしてください。
					</p>
					<Link to="/mypage" className={primaryButtonClass}>
						マイページへ
					</Link>
				</div>
			</AuthShell>
		);
	}

	if (!loaderData.valid) {
		return (
			<AuthShell title="リンクが無効です">
				<p className={css(bodyTextStyle, { mb: "1.75rem", textAlign: "center" })}>
					リンクが無効か、有効期限（24時間）が切れています。お手数ですが、マイページからもう一度お申し込みください。
				</p>
				<Link to="/mypage" className={primaryButtonClass}>
					マイページへ
				</Link>
			</AuthShell>
		);
	}

	return (
		<AuthShell title="メールアドレスの変更">
			<p className={css(bodyTextStyle, { mb: "0.5rem", textAlign: "center" })}>
				ログインに使うメールアドレスを、次のアドレスに変更します。
			</p>
			<p
				className={css({
					fontWeight: "bold",
					color: "#222222",
					textAlign: "center",
					wordBreak: "break-all",
					mb: "1.75rem",
				})}
			>
				{loaderData.newEmail}
			</p>
			<Form method="post">
				<button
					type="submit"
					disabled={navigation.state !== "idle"}
					className={css(primaryButtonStyle)}
				>
					変更する
				</button>
			</Form>
			{actionData?.error && (
				<p role="alert" className={errorClass}>
					{actionData.error}
				</p>
			)}
		</AuthShell>
	);
}
