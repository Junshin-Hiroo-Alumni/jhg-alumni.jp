import { IconExternalLink } from "@tabler/icons-react";
import { redirect, useOutletContext } from "react-router";
import { css } from "styled-system/css";
import { CARD_PX, Card, CardFooter, primaryActionClass } from "~/components/mypage/Card";
import { Field, SettingCard, type SettingResult } from "~/components/mypage/SettingCard";
import { type ApiClient, createApiClient } from "~/lib/api.server";
import { CONTACT_FORM_URL } from "~/lib/contact";
import { formatGraduationYear } from "~/lib/graduation-year";
import { buildMeta } from "~/lib/seo";
import { clearAuthCookieHeaders, memberSessionContext } from "~/lib/session.server";
import type { Route } from "./+types/profile";
import type { MyPageHandle, MyPageOutletContext } from "./layout";

export function meta() {
	return buildMeta({ title: "プロフィール設定", path: "/mypage/profile", noindex: true });
}

const sessionExpired = () => redirect("/login", { headers: clearAuthCookieHeaders() });

async function requestEmailChange(
	api: ApiClient,
	email: string,
	currentPassword: string,
): Promise<SettingResult> {
	const res = await api.v1.me.email.$post({ json: { email, currentPassword } });
	if (res.status === 401) throw sessionExpired();
	if (res.status === 202) {
		return {
			ok: true,
			message: `${email} に確認メールを送りました。届かない場合は、迷惑メールフォルダもご確認ください。`,
		};
	}
	if (res.status === 403 || res.status === 409 || res.status === 429) {
		return { ok: false, message: (await res.json()).message };
	}
	return { ok: false, message: "メールアドレスの形式が正しくありません。" };
}

export async function action({ request, context }: Route.ActionArgs): Promise<SettingResult> {
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

/** 変更できない会員情報 */
function AccountSummary({ member }: MyPageOutletContext) {
	const rows = [
		["お名前", member.name],
		["卒業年", formatGraduationYear(member.graduationYear)],
		["メールアドレス", member.email],
	];
	return (
		<Card
			id="account-summary"
			title="アカウント情報"
			description="お名前・卒業年の変更は、同窓会事務局で承ります。"
		>
			<dl className={css({ px: CARD_PX, py: "0.5rem" })}>
				{rows.map(([label, value]) => (
					<div
						key={label}
						className={css({
							display: "grid",
							gridTemplateColumns: { base: "1fr", sm: "9rem 1fr" },
							gap: "0.25rem 1rem",
							py: "0.875rem",
							fontSize: "sm",
							"& + &": { borderTop: "1px solid token(colors.mypage.divider)" },
						})}
					>
						<dt className={css({ color: "gray.500" })}>{label}</dt>
						<dd className={css({ fontWeight: "500", wordBreak: "break-all" })}>{value}</dd>
					</div>
				))}
			</dl>
			<CardFooter>
				<a href={CONTACT_FORM_URL} target="_blank" rel="noreferrer" className={primaryActionClass}>
					お問い合わせ
					<IconExternalLink size={15} stroke={2} />
				</a>
			</CardFooter>
		</Card>
	);
}

export const handle: MyPageHandle = {
	title: "プロフィール設定",
};

export default function Profile() {
	const { member } = useOutletContext<MyPageOutletContext>();
	return (
		<div className={css({ display: "grid", gap: "1.5rem" })}>
			<AccountSummary member={member} />
			<SettingCard intent="email" title="メールアドレスの変更" submitLabel="変更する">
				<Field
					label="新しいメールアドレス"
					name="value"
					type="email"
					autoComplete="email"
					placeholder="example@example.com"
					required
				/>
				<Field
					label="現在のパスワード"
					name="currentPassword"
					type="password"
					autoComplete="current-password"
					required
				/>
			</SettingCard>
		</div>
	);
}
