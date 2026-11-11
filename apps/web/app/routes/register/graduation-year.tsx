import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import {
	bodyTextStyle,
	errorClass,
	inputStyle,
	labelClass,
	primaryButtonClass,
	primaryButtonStyle,
} from "~/components/auth/styles";
import {
	formatGraduationYear,
	graduationYearOptions,
	JUNIOR_HIGH_LABEL,
	JUNIOR_HIGH_VALUE,
	parseGraduationYearValue,
} from "~/lib/graduation-year";
import {
	pathForStage,
	redirectToStart,
	registrationApi,
	requireRegistrationStage,
} from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/graduation-year";

export function meta() {
	return buildMeta({ title: "卒業年の確認", path: "/register/graduation-year", noindex: true });
}

export async function loader({ request }: Route.LoaderArgs) {
	const { yearRemainingAttempts } = await requireRegistrationStage(request, ["code_verified"]);
	return { remainingAttempts: yearRemainingAttempts, years: graduationYearOptions() };
}

type ActionResult =
	| { result: "invalid" }
	| { result: "mismatch"; remainingAttempts: number }
	| { result: "locked" };

export async function action({ request }: Route.ActionArgs): Promise<ActionResult | Response> {
	const graduationYear = parseGraduationYearValue((await request.formData()).get("graduationYear"));
	if (graduationYear === undefined) {
		return { result: "invalid" };
	}
	const res = await registrationApi(request).v1.registrations.current["graduation-year"].$post({
		json: { graduationYear },
	});
	if (res.status === 200) {
		const { verified, remainingAttempts } = await res.json();
		if (verified) {
			return redirect("/register/confirm");
		}
		return remainingAttempts === 0
			? { result: "locked" }
			: { result: "mismatch", remainingAttempts };
	}
	if (res.status === 403) {
		return { result: "locked" };
	}
	if (res.status === 409) {
		return redirect(pathForStage((await res.json()).stage));
	}
	return redirectToStart();
}

function Locked() {
	return (
		<AuthShell title="卒業年の確認" step="year">
			<div className={css({ textAlign: "center" })}>
				<IconAlertCircle
					size={48}
					className={css({ color: "orange.400", mx: "auto", mb: "1rem" })}
				/>
				<p className={css({ fontWeight: "bold", fontSize: "lg", color: "#222222" })}>
					間違えられる回数の上限に達しました
				</p>
				<p className={css(bodyTextStyle, { mt: "0.75rem", mb: "2rem" })}>
					時間をおいて、認証コードの入力からやり直してください。
				</p>
				<Link to="/register" className={primaryButtonClass}>
					最初に戻る
				</Link>
			</div>
		</AuthShell>
	);
}

export default function RegisterGraduationYear({ loaderData, actionData }: Route.ComponentProps) {
	const navigation = useNavigation();
	const [year, setYear] = useState("");
	if (actionData?.result === "locked" || loaderData.remainingAttempts === 0) {
		return <Locked />;
	}
	const error =
		actionData?.result === "mismatch"
			? `卒業年が一致しません。あと${actionData.remainingAttempts}回間違えると、認証コードの入力からやり直しになります。`
			: actionData?.result === "invalid"
				? "卒業年を選んでください。"
				: null;

	return (
		<AuthShell title="卒業年の確認" step="year">
			<p className={css(bodyTextStyle, { mb: "1.75rem" })}>
				ご本人であることを確認するため、卒業した年を選んでください。中学校を卒業された方は「
				{JUNIOR_HIGH_LABEL}」を選んでください。
			</p>
			<Form method="post">
				<label htmlFor="graduationYear" className={labelClass}>
					卒業年
				</label>
				<select
					id="graduationYear"
					name="graduationYear"
					required
					value={year}
					onChange={event => setYear(event.target.value)}
					aria-invalid={error ? true : undefined}
					className={css(inputStyle, { cursor: "pointer" })}
				>
					<option value="" disabled>
						選択してください
					</option>
					<optgroup label="卒業年">
						{loaderData.years.map(option => (
							<option key={option} value={option}>
								{formatGraduationYear(option)}
							</option>
						))}
					</optgroup>
					<optgroup label="その他">
						<option value={JUNIOR_HIGH_VALUE}>{JUNIOR_HIGH_LABEL}</option>
					</optgroup>
				</select>
				{error && (
					<p role="alert" className={errorClass}>
						{error}
					</p>
				)}
				<button
					type="submit"
					disabled={year === "" || navigation.state !== "idle"}
					className={css(primaryButtonStyle, { mt: "1.75rem" })}
				>
					次へ
				</button>
			</Form>
		</AuthShell>
	);
}
