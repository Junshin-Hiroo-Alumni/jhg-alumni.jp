import { IconArrowRight } from "@tabler/icons-react";
import { type ComponentProps, type ReactNode, useId } from "react";
import { useFetcher } from "react-router";
import { css } from "styled-system/css";
import { inputStyle } from "~/components/auth/styles";
import { CARD_PX, Card, CardFooter, primaryActionClass } from "./Card";

/** 設定フォームを受ける action が返す結果 */
export type SettingResult = { ok: boolean; message: string };

const inputClass = css(inputStyle, {
	maxW: { md: "24rem" },
	height: "2.5rem",
	px: "0.75rem",
	borderColor: "mypage.inputBorder",
	fontSize: "sm",
	_placeholder: { color: "gray.400" },
});

export function Field({
	label,
	...input
}: { label: string; name: string } & ComponentProps<"input">) {
	const id = useId();
	return (
		<div>
			<label
				htmlFor={id}
				className={css({ display: "block", fontSize: "sm", fontWeight: "500", mb: "0.375rem" })}
			>
				{label}
			</label>
			<input id={id} className={inputClass} {...input} />
		</div>
	);
}

/**
 * 1 項目分の設定フォーム
 *
 * 項目ごとに fetcher を分け、保存中の表示や結果メッセージが他の項目に影響しないようにする。
 */
export function SettingCard({
	intent,
	title,
	submitLabel = "保存",
	children,
}: {
	intent: string;
	title: string;
	submitLabel?: string;
	children: ReactNode;
}) {
	const fetcher = useFetcher<SettingResult>();
	const busy = fetcher.state !== "idle";
	const result = busy ? undefined : fetcher.data;
	return (
		<Card id={`setting-${intent}`} title={title}>
			<fetcher.Form method="post">
				<input type="hidden" name="intent" value={intent} />
				<fieldset
					aria-invalid={result?.ok === false ? true : undefined}
					className={css({
						display: "grid",
						gap: "1rem",
						px: CARD_PX,
						py: "1.25rem",
						border: "none",
						"&[aria-invalid='true'] input": { borderColor: "red.500" },
					})}
				>
					{children}
				</fieldset>
				<CardFooter
					note={
						<span
							role={result ? (result.ok ? "status" : "alert") : undefined}
							data-ok={result?.ok}
							className={css({
								"&[data-ok='true']": { color: "green.700" },
								"&[data-ok='false']": { color: "red.600" },
							})}
						>
							{result?.message}
						</span>
					}
				>
					<button type="submit" disabled={busy} className={primaryActionClass}>
						{busy ? "送信中…" : submitLabel}
						<IconArrowRight size={16} stroke={2} />
					</button>
				</CardFooter>
			</fetcher.Form>
		</Card>
	);
}
