import { css } from "styled-system/css";
import NoticeList from "~/components/notice/NoticeList";
import { getAllNotices } from "~/lib/notice";

export function meta() {
	return [{ title: "お知らせ | 順心広尾学園同窓会" }];
}

export default function Notice() {
	const notices = getAllNotices();

	return (
		<div
			className={css({
				maxW: "820px",
				mx: "auto",
				w: "full",
				px: { base: "1.5rem", md: "2rem" },
				pt: { base: "7rem", md: "9rem" },
				pb: { base: "4rem", md: "6rem" },
			})}
		>
			<h1
				className={css({
					fontSize: { base: "1.75rem", md: "2.25rem" },
					fontWeight: "bold",
					color: "#222222",
					mb: "0.5rem",
				})}
			>
				お知らせ
			</h1>
			<div
				className={css({
					width: "44px",
					height: "3px",
					bg: "green.400",
					borderRadius: "9999px",
					mb: { base: "2rem", md: "2.5rem" },
				})}
			/>

			{notices.length === 0 ? (
				<p className={css({ color: "#666666" })}>現在お知らせはありません。</p>
			) : (
				<NoticeList items={notices} />
			)}
		</div>
	);
}
