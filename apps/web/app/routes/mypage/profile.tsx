import type { ReactNode } from "react";
import { redirect, useFetcher, useOutletContext } from "react-router";
import { css } from "styled-system/css";
import { inputStyle, primaryButtonStyle } from "~/components/auth/styles";
import { type ApiClient, createApiClient } from "~/lib/api.server";
import { MAIL_SENDER } from "~/lib/contact";
import { formatGraduationYear } from "~/lib/graduation-year";
import { buildMeta } from "~/lib/seo";
import { clearAuthCookieHeaders, memberSessionContext } from "~/lib/session.server";
import type { Route } from "./+types/profile";
import type { MyPageHandle, MyPageOutletContext } from "./layout";

export function meta() {
	return buildMeta({ title: "プロフィール設定", path: "/mypage/profile", noindex: true });
}

type ActionResult = { ok: boolean; message: string };

const sessionExpired = () => redirect("/login", { headers: clearAuthCookieHeaders() });

async function requestEmailChange(
	api: ApiClient,
	email: string,
	currentPassword: string,
): Promise<ActionResult> {
	const res = await api.v1.me.email.$post({ json: { email, currentPassword } });
	if (res.status === 401) throw sessionExpired();
	if (res.status === 202) {
		return {
			ok: true,
			message: `${email} に確認メールを送りました。メール内のリンクを開くと変更が完了します。届かない場合は、迷惑メールフォルダもご確認ください（送信元: ${MAIL_SENDER}）。`,
		};
	}
	if (res.status === 403 || res.status === 409 || res.status === 429) {
		return { ok: false, message: (await res.json()).message };
	}
	return { ok: false, message: "メールアドレスの形式が正しくありません。" };
}

export async function action({ request, context }: Route.ActionArgs): Promise<ActionResult> {
	const { accessToken } = context.get(memberSessionContext);
	const api = createApiClient(request, { accessToken });
	const form = await request.formData();
	const value = String(form.get("value") ?? "");
	switch (form.get("intent")) {
		case "email":
			return await requestEmailChange(api, value, String(form.get("currentPassword") ?? ""));
		default:
			return { ok: false, message: "不正な操作です。" };
	}
}

const cardClass = css({
	bg: "#FFFFFF",
	border: "1px solid token(colors.gray.200)",
	borderRadius: "0.75rem",
	overflow: "hidden",
});

const dashboardInputStyle = css.raw(inputStyle, {
	maxW: "480px",
	height: "2.5rem",
	borderRadius: "0.375rem",
	fontSize: "sm",
});

function CardHeader({ title, description }: { title: string; description?: string }) {
	return (
		<div className={css({ px: "1.5rem", pt: "1.25rem" })}>
			<h2 className={css({ fontSize: "md", fontWeight: "bold" })}>{title}</h2>
			{description && (
				<p className={css({ mt: "0.25rem", fontSize: "sm", color: "gray.600", lineHeight: "1.7" })}>
					{description}
				</p>
			)}
		</div>
	);
}

/** 変更できない会員情報 */
function AccountSummary({ member }: MyPageOutletContext) {
	const rows = [
		["お名前", member.name],
		["卒業年", formatGraduationYear(member.graduationYear)],
		["メールアドレス", member.email],
		["登録日", new Date(member.createdAt).toLocaleDateString("ja-JP")],
	];
	return (
		<section className={cardClass}>
			<CardHeader
				title="アカウント情報"
				description="お名前・卒業年の変更が必要な場合は、同窓会事務局までお問い合わせください。"
			/>
			<dl
				className={css({
					display: "grid",
					gridTemplateColumns: { base: "1fr", md: "repeat(2, 1fr)" },
					gap: "1rem",
					px: "1.5rem",
					py: "1.25rem",
				})}
			>
				{rows.map(([label, value]) => (
					<div key={label}>
						<dt className={css({ fontSize: "xs", color: "gray.500" })}>{label}</dt>
						<dd
							className={css({
								mt: "0.25rem",
								fontSize: "sm",
								fontWeight: "bold",
								wordBreak: "break-all",
							})}
						>
							{value}
						</dd>
					</div>
				))}
			</dl>
		</section>
	);
}

/**
 * 1 項目分の設定カード
 *
 * 項目ごとに fetcher を分け、保存中の表示や結果メッセージが他の項目に影響しないようにする。
 */
function SettingCard({
	intent,
	title,
	description,
	label,
	type = "text",
	submitLabel = "保存",
	autoComplete,
	required = false,
	children,
}: {
	intent: string;
	title: string;
	description?: string;
	label: string;
	type?: "text" | "email";
	submitLabel?: string;
	autoComplete?: string;
	required?: boolean;
	/** 入力欄の下に追加する欄 */
	children?: ReactNode;
}) {
	const fetcher = useFetcher<ActionResult>();
	const result = fetcher.state === "idle" ? fetcher.data : undefined;
	const inputId = `profile-${intent}`;
	return (
		<fetcher.Form method="post" className={cardClass}>
			<input type="hidden" name="intent" value={intent} />
			<CardHeader title={title} description={description} />
			<div className={css({ px: "1.5rem", py: "1.25rem" })}>
				<label
					htmlFor={inputId}
					className={css({ display: "block", fontSize: "sm", fontWeight: "500", mb: "0.375rem" })}
				>
					{label}
				</label>
				<input
					id={inputId}
					name="value"
					type={type}
					autoComplete={autoComplete}
					required={required}
					aria-invalid={result?.ok === false ? true : undefined}
					className={css(dashboardInputStyle)}
				/>
				{children}
			</div>
			<div
				className={css({
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: "1rem",
					px: "1.5rem",
					py: "0.75rem",
					bg: "gray.50",
					borderTop: "1px solid token(colors.gray.200)",
				})}
			>
				<p
					role={result ? (result.ok ? "status" : "alert") : undefined}
					data-ok={result?.ok}
					className={css({
						fontSize: "sm",
						color: "gray.600",
						"&[data-ok='true']": { color: "green.700" },
						"&[data-ok='false']": { color: "red.600" },
					})}
				>
					{result?.message}
				</p>
				<button
					type="submit"
					disabled={fetcher.state !== "idle"}
					className={css(primaryButtonStyle, {
						width: "auto",
						height: "2.25rem",
						px: "1rem",
						borderRadius: "0.375rem",
						fontSize: "sm",
						flexShrink: 0,
					})}
				>
					{fetcher.state !== "idle" ? "保存中…" : submitLabel}
				</button>
			</div>
		</fetcher.Form>
	);
}

export const handle: MyPageHandle = {
	title: "プロフィール設定",
	description: "ログインに使うメールアドレスを変更できます。",
};

export default function Profile() {
	const { member } = useOutletContext<MyPageOutletContext>();
	return (
		<div className={css({ display: "grid", gap: "1.25rem" })}>
			<AccountSummary member={member} />
			<SettingCard
				intent="email"
				title="メールアドレス"
				description="新しいアドレスに確認メールを送ります。メール内のリンクを開くまでは、現在のアドレスでログインします。"
				label="新しいメールアドレス"
				type="email"
				autoComplete="email"
				required
				submitLabel="確認メールを送信"
			>
				<label
					htmlFor="profile-email-password"
					className={css({
						display: "block",
						fontSize: "sm",
						fontWeight: "500",
						mt: "1rem",
						mb: "0.375rem",
					})}
				>
					現在のパスワード
				</label>
				<input
					id="profile-email-password"
					name="currentPassword"
					type="password"
					autoComplete="current-password"
					required
					className={css(dashboardInputStyle)}
				/>
			</SettingCard>
		</div>
	);
}
