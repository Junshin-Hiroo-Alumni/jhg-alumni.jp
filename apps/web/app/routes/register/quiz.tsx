import { IconAlertCircle } from "@tabler/icons-react";
import { useState } from "react";
import { Form, Link, redirect, useNavigation } from "react-router";
import { css } from "styled-system/css";
import AuthShell from "~/components/auth/AuthShell";
import { bodyTextStyle, primaryButtonClass, secondaryButtonClass } from "~/components/auth/styles";
import { pathForStage, redirectToStart, registrationApi } from "~/lib/registration.server";
import { buildMeta } from "~/lib/seo";
import type { Route } from "./+types/quiz";

export function meta() {
	return buildMeta({ title: "クイズ", path: "/register/quiz", noindex: true });
}

export async function loader({ request }: Route.LoaderArgs) {
	const res = await registrationApi(request).v1.registrations.current.quiz.$get();
	if (res.status === 200) {
		return { ...(await res.json()), locked: false };
	}
	if (res.status === 403) {
		return { questions: [], remainingAttempts: 0, locked: true };
	}
	if (res.status === 409) {
		throw redirect(pathForStage((await res.json()).stage));
	}
	throw redirectToStart();
}

export async function action({ request }: Route.ActionArgs) {
	const form = await request.formData();
	const answers: Record<string, string[]> = {};
	for (const [key, value] of form) {
		if (key.startsWith("answer:")) {
			const id = key.slice("answer:".length);
			answers[id] = [...(answers[id] ?? []), String(value)];
		}
	}
	const res = await registrationApi(request).v1.registrations.current.quiz.$post({
		json: { answers },
	});
	if (res.status === 200) {
		const { passed, remainingAttempts } = await res.json();
		return passed ? redirect("/register/email") : { failed: true, remainingAttempts };
	}
	if (res.status === 403) {
		return { failed: true, remainingAttempts: 0 };
	}
	if (res.status === 409) {
		return redirect(pathForStage((await res.json()).stage));
	}
	return redirectToStart();
}

const choiceClass = css({
	display: "flex",
	alignItems: "center",
	gap: "0.875rem",
	px: "1.125rem",
	py: { base: "0.875rem", lg: "0.625rem" },
	borderRadius: "0.5rem",
	border: "1px solid token(colors.gray.200)",
	bg: "#FFFFFF",
	cursor: "pointer",
	fontSize: "md",
	color: "gray.800",
	transition: "border-color 0.15s ease, background-color 0.15s ease",
	_hover: { borderColor: "green.300" },
	"&:has(input:checked)": { borderColor: "green.500", bg: "green.50" },
	"&:has(input:focus-visible)": { boxShadow: "0 0 0 3px token(colors.green.100)" },
	"& input": { accentColor: "token(colors.green.600)", width: "1.125rem", height: "1.125rem" },
});

/** 不正解だったとき、または挑戦回数を使い切ったときの表示 */
function QuizFailed({ remaining }: { remaining: number }) {
	const locked = remaining === 0;
	return (
		<AuthShell title="クイズ" step="quiz">
			<div className={css({ textAlign: "center" })}>
				<IconAlertCircle
					size={48}
					className={css({ color: "orange.400", mx: "auto", mb: "1rem" })}
				/>
				<p className={css({ fontWeight: "bold", fontSize: "lg", color: "#222222" })}>
					{locked ? "挑戦できる回数の上限に達しました" : "正解できなかった問題があります"}
				</p>
				<p className={css(bodyTextStyle, { mt: "0.75rem", mb: "2rem" })}>
					{locked
						? "時間をおいて、認証コードの入力からやり直してください。"
						: `別の問題でもう一度挑戦できます（残り${remaining}回）。`}
				</p>
				{/* ページを読み直して新しい問題を取得する */}
				<Link
					to={locked ? "/register" : "/register/quiz"}
					reloadDocument
					className={primaryButtonClass}
				>
					{locked ? "最初に戻る" : "もう一度挑戦する"}
				</Link>
			</div>
		</AuthShell>
	);
}

export default function RegisterQuiz({ loaderData, actionData }: Route.ComponentProps) {
	const { questions } = loaderData;
	const navigation = useNavigation();
	const [index, setIndex] = useState(0);
	const [answers, setAnswers] = useState<Record<string, string[]>>({});

	if (actionData?.failed || loaderData.locked) {
		return (
			<QuizFailed
				remaining={actionData?.failed ? actionData.remainingAttempts : loaderData.remainingAttempts}
			/>
		);
	}

	const question = questions[index];
	if (!question) {
		return null;
	}
	const selected = answers[question.id] ?? [];
	const isLast = index === questions.length - 1;
	const toggle = (choiceId: string) =>
		setAnswers(prev => ({
			...prev,
			[question.id]:
				question.type === "single"
					? [choiceId]
					: selected.includes(choiceId)
						? selected.filter(id => id !== choiceId)
						: [...selected, choiceId],
		}));

	return (
		<AuthShell title="クイズ" step="quiz">
			<p
				className={css(bodyTextStyle, { textAlign: "center", mb: { base: "1.5rem", lg: "1rem" } })}
			>
				同窓生であることを確認するため、{questions.length}問すべてに正解してください。
			</p>

			<div
				role="progressbar"
				aria-valuemin={1}
				aria-valuemax={questions.length}
				aria-valuenow={index + 1}
				className={css({ display: "flex", gap: "0.375rem", mb: { base: "1.5rem", lg: "1rem" } })}
			>
				{questions.map((q, i) => (
					<span
						key={q.id}
						data-active={i <= index}
						className={css({
							flex: "1",
							height: "4px",
							borderRadius: "9999px",
							bg: "gray.200",
							"&[data-active='true']": { bg: "green.500" },
						})}
					/>
				))}
			</div>

			<p className={css({ fontSize: "sm", fontWeight: "bold", color: "green.600", mb: "0.5rem" })}>
				第{index + 1}問
				<span className={css({ ml: "0.75rem", color: "gray.500", fontWeight: "normal" })}>
					{question.type === "single"
						? "1つ選んでください"
						: "当てはまるものをすべて選んでください"}
				</span>
			</p>
			<p
				className={css({
					fontSize: { base: "lg", md: "xl" },
					fontWeight: "bold",
					color: "#222222",
					lineHeight: "1.6",
					mb: { base: "1.25rem", lg: "1rem" },
				})}
			>
				{question.text}
			</p>
			{/* PC 幅では画像を左、選択肢を右に並べて縦に収める */}
			<div
				data-has-image={question.image !== undefined}
				className={css({
					display: "grid",
					gap: "1rem",
					lg: {
						"&[data-has-image='true']": { gridTemplateColumns: "200px 1fr", alignItems: "start" },
					},
				})}
			>
				{question.image && (
					<img
						src={question.image}
						alt=""
						className={css({
							width: "100%",
							maxH: "280px",
							objectFit: "cover",
							borderRadius: "0.5rem",
							lg: { maxH: "none", aspectRatio: "4 / 3" },
						})}
					/>
				)}
				<fieldset className={css({ display: "grid", gap: "0.625rem" })}>
					<legend className={css({ srOnly: true })}>{question.text}</legend>
					{question.choices.map(choice => (
						<label key={choice.id} className={choiceClass}>
							<input
								type={question.type === "single" ? "radio" : "checkbox"}
								name={`choice:${question.id}`}
								checked={selected.includes(choice.id)}
								onChange={() => toggle(choice.id)}
							/>
							{choice.text}
						</label>
					))}
				</fieldset>
			</div>

			<Form method="post">
				{Object.entries(answers).flatMap(([id, values]) =>
					values.map(value => (
						<input key={`${id}:${value}`} type="hidden" name={`answer:${id}`} value={value} />
					)),
				)}
				<div
					className={css({
						display: "grid",
						gridTemplateColumns: index > 0 ? "1fr 1fr" : "1fr",
						gap: "0.75rem",
						mt: { base: "2rem", lg: "1.5rem" },
					})}
				>
					{index > 0 && (
						<button
							type="button"
							onClick={() => setIndex(i => i - 1)}
							className={secondaryButtonClass}
						>
							戻る
						</button>
					)}
					{isLast ? (
						<button
							type="submit"
							disabled={selected.length === 0 || navigation.state !== "idle"}
							className={primaryButtonClass}
						>
							回答を送信
						</button>
					) : (
						<button
							type="button"
							disabled={selected.length === 0}
							onClick={() => setIndex(i => i + 1)}
							className={primaryButtonClass}
						>
							次の問題へ
						</button>
					)}
				</div>
			</Form>
		</AuthShell>
	);
}
