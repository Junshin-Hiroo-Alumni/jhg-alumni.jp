import { redirect, useFetcher, useOutletContext } from "react-router";
import { css } from "styled-system/css";
import { inputStyle, primaryButtonStyle } from "~/components/auth/styles";
import { type ApiClient, createApiClient } from "~/lib/api.server";
import { buildMeta } from "~/lib/seo";
import { clearAuthCookieHeaders, memberSessionContext } from "~/lib/session.server";
import type { Route } from "./+types/profile";
import type { MyPageHandle, MyPageOutletContext } from "./layout";

export function meta() {
	return buildMeta({ title: "プロフィール設定", path: "/mypage/profile", noindex: true });
}

type ActionResult = { ok: boolean; message: string };

const sessionExpired = () => redirect("/login", { headers: clearAuthCookieHeaders() });

async function updateName(api: ApiClient, name: string): Promise<ActionResult> {
	const res = await api.v1.me.$patch({ json: { name } });
	if (res.status === 401) throw sessionExpired();
	return res.status === 200
		? { ok: true, message: "お名前を保存しました。" }
		: { ok: false, message: "お名前は1〜100文字で入力してください。" };
}

async function updateAddress(api: ApiClient, address: string): Promise<ActionResult> {
	const res = await api.v1.me.$patch({ json: { address } });
	if (res.status === 401) throw sessionExpired();
	return res.status === 200
		? { ok: true, message: "住所を保存しました。" }
		: { ok: false, message: "住所は200文字以内で入力してください。" };
}

async function requestEmailChange(api: ApiClient, email: string): Promise<ActionResult> {
	const res = await api.v1.me.email.$post({ json: { email } });
	if (res.status === 401) throw sessionExpired();
	if (res.status === 202) {
		return {
			ok: true,
			message: `${email} に確認メールを送りました。メール内のリンクを開くと変更が完了します。`,
		};
	}
	if (res.status === 409 || res.status === 429) {
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
		case "name":
			return await updateName(api, value);
		case "address":
			return await updateAddress(api, value);
		case "email":
			return await requestEmailChange(api, value);
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
		["卒業年度", member.graduationYear ? `${member.graduationYear}年度` : "未登録"],
		["メールアドレス", member.email],
		["登録日", new Date(member.createdAt).toLocaleDateString("ja-JP")],
	];
	return (
		<section className={cardClass}>
			<CardHeader
				title="アカウント情報"
				description="卒業年度の変更が必要な場合は、同窓会事務局までお問い合わせください。"
			/>
			<dl
				className={css({
					display: "grid",
					gridTemplateColumns: { base: "1fr", md: "repeat(3, 1fr)" },
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
	defaultValue,
	placeholder,
	submitLabel = "保存",
	autoComplete,
	required = false,
}: {
	intent: string;
	title: string;
	description?: string;
	label: string;
	type?: "text" | "email";
	defaultValue?: string;
	placeholder?: string;
	submitLabel?: string;
	autoComplete?: string;
	required?: boolean;
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
					defaultValue={defaultValue}
					placeholder={placeholder}
					autoComplete={autoComplete}
					required={required}
					aria-invalid={result?.ok === false ? true : undefined}
					className={css(dashboardInputStyle)}
				/>
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
	description: "お名前・住所・ログインに使うメールアドレスを変更できます。",
};

export default function Profile() {
	const { member } = useOutletContext<MyPageOutletContext>();
	return (
		<div className={css({ display: "grid", gap: "1.25rem" })}>
			<AccountSummary member={member} />
			<SettingCard
				intent="name"
				title="お名前"
				description="マイページや同窓会からのお知らせに表示されるお名前です。"
				label="お名前"
				defaultValue={member.name}
				autoComplete="name"
				required
			/>
			<SettingCard
				intent="address"
				title="住所"
				description="同窓会からの郵送物のお届けに使います。空欄にして保存すると削除されます。"
				label="住所"
				defaultValue={member.address ?? ""}
				placeholder="例: 東京都港区南麻布5-1-14"
				autoComplete="street-address"
			/>
			<SettingCard
				intent="email"
				title="メールアドレス"
				description="新しいアドレスに確認メールを送ります。メール内のリンクを開くまでは、現在のアドレスでログインします。"
				label="新しいメールアドレス"
				type="email"
				autoComplete="email"
				required
				submitLabel="確認メールを送信"
			/>
		</div>
	);
}
