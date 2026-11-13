import { IconAlertTriangle } from "@tabler/icons-react";
import { css } from "styled-system/css";
import { MAIL_SENDER } from "~/lib/contact";

export default function SpamFolderNotice() {
	return (
		<div
			className={css({
				display: "flex",
				gap: "0.625rem",
				px: "1rem",
				py: "0.875rem",
				borderRadius: "0.5rem",
				bg: "amber.50",
				border: "1px solid token(colors.amber.200)",
				color: "amber.900",
				fontSize: "sm",
				lineHeight: "1.7",
				textAlign: "left",
			})}
		>
			<IconAlertTriangle
				size={20}
				stroke={1.75}
				aria-hidden
				className={css({ flexShrink: 0, mt: "0.125rem", color: "amber.600" })}
			/>
			<p>
				メールが見つからない場合は、
				<strong>迷惑メールフォルダ</strong>
				もご確認ください。送信元は
				<span className={css({ fontWeight: "bold", wordBreak: "break-all" })}>{MAIL_SENDER}</span>
				です。
			</p>
		</div>
	);
}
