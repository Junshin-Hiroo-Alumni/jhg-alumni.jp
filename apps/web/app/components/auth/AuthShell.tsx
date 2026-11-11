import type { ReactNode } from "react";
import { css } from "styled-system/css";
import RegisterSteps, { type RegisterStep } from "./RegisterSteps";

type AuthShellProps = {
	title: string;
	/** 会員登録の進行状況。指定するとステップ表示を出す */
	step?: RegisterStep;
	children: ReactNode;
};

/**
 * ログイン・会員登録画面の共通レイアウト（白いカード）
 *
 * ログインは画面の縦中央に置く。会員登録はステップ間で位置と幅が変わらないよう、
 * 上端をそろえて全ステップ同じ幅にする。
 */
export default function AuthShell({ title, step, children }: AuthShellProps) {
	return (
		<div
			data-register={step !== undefined}
			className={css({
				minHeight: "100dvh",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				// 上下の余白は左上のロゴと重ならない高さにする。
				// PC 幅ではカードがロゴの横に来るため、スクロールせずに収まるよう詰める
				px: { base: "1rem", md: "2rem" },
				py: { base: "6rem", md: "7.5rem", lg: "2.5rem" },
				"&[data-register='true']": { justifyContent: "flex-start" },
			})}
		>
			<div
				data-register={step !== undefined}
				className={css({
					width: "100%",
					mx: "auto",
					maxW: "440px",
					"&[data-register='true']": { maxW: "560px" },
				})}
			>
				{step && <RegisterSteps current={step} />}
				<div
					className={css({
						bg: "#FFFFFF",
						borderRadius: "1rem",
						boxShadow: "0 6px 24px rgba(0, 0, 0, 0.06)",
						px: { base: "1.5rem", md: "2.5rem" },
						py: { base: "2rem", md: "2.5rem", lg: "2rem" },
					})}
				>
					<h1
						className={css({
							fontSize: { base: "1.375rem", md: "1.5rem" },
							fontWeight: "bold",
							color: "#222222",
							textAlign: "center",
						})}
					>
						{title}
					</h1>
					<div
						className={css({
							width: "36px",
							height: "3px",
							bg: "green.400",
							borderRadius: "9999px",
							mx: "auto",
							mt: "0.875rem",
							mb: { base: "1.75rem", lg: "1.25rem" },
						})}
					/>
					{children}
				</div>
			</div>
		</div>
	);
}
