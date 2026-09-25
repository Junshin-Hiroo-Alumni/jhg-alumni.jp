import { Form, Link, redirect } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import { bodyTextStyle, primaryButtonClass, secondaryButtonClass } from "~/components/auth/styles";
import {
	pathForStage,
	redirectToStart,
	registrationApi,
	requireRegistrationStage,
} from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/confirm";

export function meta() {
	return buildMeta({ title: "本人確認", path: "/register/confirm", noindex: true });
}

export async function loader({ request }: Route.LoaderArgs) {
	const { member } = await requireRegistrationStage(request, ["code_verified"]);
	return { member };
}

export async function action({ request }: Route.ActionArgs) {
	const res = await registrationApi(request).v1.registrations.current.confirm.$post();
	if (res.status === 200) {
		return redirect("/register/quiz");
	}
	if (res.status === 409) {
		return redirect(pathForStage((await res.json()).stage));
	}
	return redirectToStart();
}

const rowClass = css({
	display: "flex",
	justifyContent: "space-between",
	alignItems: "baseline",
	gap: "1rem",
	py: "1rem",
	"&:not(:first-child)": { borderTop: "1px solid token(colors.green.100)" },
});

export default function RegisterConfirm({ loaderData }: Route.ComponentProps) {
	const { member } = loaderData;
	return (
		<AuthShell title="本人確認" step="confirm">
			<p className={css(bodyTextStyle, { mb: "1.5rem", textAlign: "center" })}>
				以下の内容があなたご本人の情報か確認してください。
			</p>
			<dl
				className={css({
					bg: "green.50",
					borderRadius: "0.75rem",
					px: "1.5rem",
					py: "0.25rem",
					mb: "2rem",
				})}
			>
				<div className={rowClass}>
					<dt className={css({ fontSize: "sm", color: "gray.600" })}>卒業年度</dt>
					<dd className={css({ fontWeight: "bold", fontSize: "lg", color: "#222222" })}>
						{member.graduationYear}年度
					</dd>
				</div>
				<div className={rowClass}>
					<dt className={css({ fontSize: "sm", color: "gray.600" })}>お名前</dt>
					<dd className={css({ fontWeight: "bold", fontSize: "lg", color: "#222222" })}>
						{member.name}
					</dd>
				</div>
			</dl>
			<Form method="post" className={css({ display: "grid", gap: "0.75rem" })}>
				<button type="submit" className={primaryButtonClass}>
					登録に進む
				</button>
				<Link to="/register" className={secondaryButtonClass}>
					私ではありません
				</Link>
			</Form>
			<p className={css({ mt: "1.5rem", textAlign: "center", fontSize: "xs", color: "gray.500" })}>
				情報が異なる場合は、お手数ですが同窓会事務局までお問い合わせください。
			</p>
		</AuthShell>
	);
}
