import { IconMailForward } from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Form, Link, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	secondaryButtonClass,
	textLinkClass,
} from "~/components/auth/styles";
import {
	redirectToStart,
	registrationApi,
	requireRegistrationStage,
} from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/email-sent";

export function meta() {
	return buildMeta({
		title: "確認メールを送信しました",
		path: "/register/email-sent",
		noindex: true,
	});
}

export async function loader({ request }: Route.LoaderArgs) {
	const { email } = await requireRegistrationStage(request, ["email_sent"]);
	return { email: email ?? "" };
}

/** 確認メールの再送信 */
export async function action({ request }: Route.ActionArgs) {
	const { email } = await requireRegistrationStage(request, ["email_sent"]);
	if (!email) {
		return redirectToStart();
	}
	const res = await registrationApi(request).v1.registrations.current.email.$post({
		json: { email },
	});
	if (res.status === 202) {
		return { resentAt: Date.now() };
	}
	if (res.status === 404 || res.status === 409 || res.status === 429) {
		return { error: (await res.json()).message };
	}
	return { error: "再送信に失敗しました。時間をおいて、もう一度お試しください。" };
}

const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterEmailSent({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
	const resentAt = actionData && "resentAt" in actionData ? actionData.resentAt : undefined;

	// 再送信したらカウントダウンをやり直す
	useEffect(() => {
		if (resentAt) {
			setCooldown(RESEND_COOLDOWN_SECONDS);
		}
	}, [resentAt]);

	useEffect(() => {
		if (cooldown <= 0) {
			return;
		}
		const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
		return () => clearTimeout(timer);
	}, [cooldown]);

	return (
		<AuthShell title="確認メールを送信しました" step="email">
			<div className={css({ textAlign: "center" })}>
				<IconMailForward
					size={56}
					stroke={1.5}
					className={css({ color: "green.500", mx: "auto", mb: "1.25rem" })}
				/>
				<p className={css({ fontWeight: "bold", color: "#222222", wordBreak: "break-all" })}>
					{loaderData.email}
				</p>
				<p className={css(bodyTextStyle, { mt: "1rem", mb: "2rem" })}>
					メールに記載されたリンクを開いて、登録を完了してください。リンクの有効期限は24時間です。
				</p>
				<Form method="post">
					<button
						type="submit"
						disabled={cooldown > 0 || navigation.state !== "idle"}
						className={secondaryButtonClass}
					>
						{cooldown > 0 ? `再送信（${cooldown}秒後に可能）` : "確認メールを再送信"}
					</button>
				</Form>
				{actionData && "error" in actionData && (
					<p role="alert" className={errorClass}>
						{actionData.error}
					</p>
				)}
				<p className={css({ mt: "1.5rem", fontSize: "sm" })}>
					<Link to="/register/email" className={textLinkClass}>
						メールアドレスを変更する
					</Link>
				</p>
			</div>
		</AuthShell>
	);
}
