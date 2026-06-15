import { Link } from "react-router";
import { css } from "styled-system/css";
import NoticeList from "~/components/notice/NoticeList";
import SectionHeading from "~/components/ui/SectionHeading";
import { getLatestNotices } from "~/lib/notice";

export default function NoticePreview() {
	const notices = getLatestNotices(3);

	return (
		<section
			className={css({
				bg: "#ffffff",
				px: { base: "1.5rem", md: "2rem" },
				py: { base: "4rem", md: "6rem" },
			})}
		>
			<div className={css({ maxW: "820px", mx: "auto", w: "full" })}>
				<SectionHeading eyebrow="NOTICE" title="お知らせ" />

				{notices.length === 0 ? (
					<p className={css({ textAlign: "center", color: "#666666" })}>
						現在お知らせはありません。
					</p>
				) : (
					<NoticeList items={notices} />
				)}

				<div className={css({ mt: "2.5rem", textAlign: "center" })}>
					<Link
						to="/notice"
						className={css({
							display: "inline-block",
							fontWeight: "bold",
							color: "green.500",
							border: "2px solid token(colors.green.400)",
							borderRadius: "9999px",
							px: "2rem",
							py: "0.75rem",
							textDecoration: "none",
							transition: "background-color 0.15s ease, color 0.15s ease",
							_hover: { bg: "green.400", color: "#ffffff" },
						})}
					>
						お知らせ一覧へ
					</Link>
				</div>
			</div>
		</section>
	);
}
