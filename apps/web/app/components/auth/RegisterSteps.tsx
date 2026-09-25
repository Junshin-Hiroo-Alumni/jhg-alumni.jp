import { IconCheck } from "@tabler/icons-react";
import { css } from "styled-system/css";

const steps = [
	{ id: "code", label: "認証コード" },
	{ id: "confirm", label: "本人確認" },
	{ id: "quiz", label: "クイズ" },
	{ id: "email", label: "メール" },
	{ id: "password", label: "パスワード" },
] as const;

export type RegisterStep = (typeof steps)[number]["id"];

export default function RegisterSteps({ current }: { current: RegisterStep }) {
	const currentIndex = steps.findIndex(step => step.id === current);
	return (
		<ol
			aria-label="登録の進行状況"
			className={css({
				display: "flex",
				justifyContent: "space-between",
				mb: { base: "1.5rem", lg: "1.25rem" },
				px: "0.25rem",
			})}
		>
			{steps.map((step, index) => {
				const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
				return (
					<li
						key={step.id}
						data-state={state}
						aria-current={state === "current" ? "step" : undefined}
						className={css({
							flex: "1",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							gap: "0.375rem",
							position: "relative",
							fontSize: { base: "0.65rem", md: "xs" },
							fontWeight: "bold",
							color: "gray.400",
							"&[data-state='current'], &[data-state='done']": { color: "green.700" },
							// ステップ間の線
							"&:not(:first-child)::before": {
								content: '""',
								position: "absolute",
								top: "0.875rem",
								right: "calc(50% + 1.125rem)",
								width: "calc(100% - 2.25rem)",
								height: "2px",
								bg: "gray.300",
							},
							"&[data-state='current']:not(:first-child)::before, &[data-state='done']:not(:first-child)::before":
								{ bg: "green.400" },
						})}
					>
						<span
							className={css({
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "1.75rem",
								height: "1.75rem",
								borderRadius: "9999px",
								bg: "#FFFFFF",
								border: "2px solid token(colors.gray.300)",
								fontSize: "xs",
								"[data-state='current'] > &": {
									bg: "green.600",
									borderColor: "green.600",
									color: "#FFFFFF",
								},
								"[data-state='done'] > &": {
									bg: "green.100",
									borderColor: "green.400",
								},
							})}
						>
							{state === "done" ? <IconCheck size={14} stroke={3} /> : index + 1}
						</span>
						{step.label}
					</li>
				);
			})}
		</ol>
	);
}
