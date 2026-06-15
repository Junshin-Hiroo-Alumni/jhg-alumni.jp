import { css } from "styled-system/css";
import SectionHeading from "~/components/ui/SectionHeading";

const PARAGRAPHS = [
	"この度、順心広尾学園同窓会の新会長に就任いたしました、竹西怜と申します。",
	"広尾学園は共学化からまもなく20年、順心女子学園の時代から数えれば110年にわたり、多くの卒業生を社会へ送り出してきた伝統ある学園です。",
	"いま日本は、少子化や経済成長への不安など、大きな課題に直面しています。だからこそ、先進的な広尾学園で学んだ卒業生と、長い伝統をつないできた順心生が世代を超えて協働し、母校の未来、そして社会の未来を切り開いていくことが求められています。",
	"同窓会は、懐かしさを分かち合うだけの場ではありません。卒業生同士をつなぎ、母校を支え、次の世代へ希望を受け継ぐための場です。",
	"かつて英国海軍のネルソン提督は、フランスのナポレオンとの決戦、トラファルガー海戦を前に、艦隊へこう呼びかけました。",
	"“England expects that every man will do his duty.”（英国は、各員がその務めを果たすことを期待する）",
	"順心広尾学園同窓会においても、卒業生一人ひとりがそれぞれの役割を果たし、順心から広尾へと受け継がれてきた歩みを、皆さまとともに次の世代へつないでまいります。",
	"今後とも、順心広尾学園同窓会の活動にご理解とご協力を賜りますよう、よろしくお願い申し上げます。",
];

export default function Greeting() {
	return (
		<section
			className={css({
				bg: "#ffffff",
				px: { base: "1.5rem", md: "2rem" },
				py: { base: "4rem", md: "6rem" },
			})}
		>
			<div className={css({ maxW: "1040px", mx: "auto", w: "full" })}>
				<SectionHeading eyebrow="GREETING" title="ごあいさつ" />

				<div
					className={css({
						position: "relative",
						bg: "#f5f9f7",
						borderRadius: { base: "1.25rem", md: "2rem" },
						px: { base: "1.5rem", md: "3.5rem" },
						py: { base: "2.25rem", md: "3.25rem" },
						display: "grid",
						gridTemplateColumns: { base: "1fr", md: "260px 1fr" },
						gap: { base: "2.25rem", md: "3.5rem" },
						alignItems: "start",
					})}
				>
					{/* プロフィールカード: 写真 + 肩書き + 氏名（PCでは追従） */}
					<aside
						className={css({
							justifySelf: { base: "center", md: "stretch" },
							width: { base: "min(240px, 100%)", md: "auto" },
							textAlign: { base: "center", md: "left" },
						})}
					>
						<img
							src="/site/home/chairman.webp"
							alt="順心広尾学園同窓会 会長 竹西怜"
							width={520}
							height={650}
							loading="lazy"
							className={css({
								width: "100%",
								aspectRatio: "4 / 5",
								objectFit: "cover",
								objectPosition: "center 18%",
								display: "block",
								borderRadius: "1rem",
								boxShadow: "0 18px 40px rgba(31, 71, 51, 0.18)",
							})}
						/>
						<p
							className={css({
								mt: "1.25rem",
								fontSize: "0.8rem",
								fontWeight: "bold",
								letterSpacing: "0.08em",
								color: "green.500",
							})}
						>
							順心広尾学園同窓会 会長
						</p>
						<p
							className={css({
								mt: "0.35rem",
								fontSize: "1.35rem",
								fontWeight: "bold",
								color: "#222222",
								letterSpacing: "0.04em",
							})}
						>
							竹西 怜
						</p>
					</aside>

					{/* 本文 */}
					<div>
						<h3
							className={css({
								fontFamily: '"Cormorant Garamond", serif',
								fontSize: { base: "1.55rem", md: "2rem" },
								fontWeight: "600",
								fontStyle: "italic",
								color: "#1f4733",
								lineHeight: "1.35",
								mb: { base: "1.75rem", md: "2.25rem" },
							})}
						>
							Hiroo expects that every graduate will do their part.
						</h3>

						<div
							className={css({
								color: "#3f463f",
								lineHeight: "2.1",
								fontSize: { base: "0.95rem", md: "1rem" },
								"& > p:not(:last-child)": { mb: "1.25rem" },
							})}
						>
							{PARAGRAPHS.map(text => (
								<p key={text}>{text}</p>
							))}
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
