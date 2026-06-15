import { css } from "styled-system/css";
import SectionHeading from "~/components/ui/SectionHeading";

const meta = [
	{ id: "founded", label: "設立", value: "108年" },
	{ id: "members", label: "会員数", value: "約30,000名" },
];

const LEAD = "母校で育んだ絆を、世代を超えて未来へ。";

const BODY =
	"順心広尾学園同窓会は、巣立った卒業生が、世代を越えてつながるための会です。" +
	"同窓の交流を深めながら母校の歩みを支え、次の世代へ希望を受け継いでいくことを目指しています。" +
	"在学時の思い出を分かち合うだけでなく、卒業生が力を持ち寄り、母校とともに歩み続ける。" +
	"そんな場でありたいと願っています。";

// 句読点（、。）で文節に区切り、各文節を inline-block にして文節内での改行を防ぐ。
// これにより「中途半端な改行」がなくなり、折り返しは必ず句読点の位置で起きる。
function Phrased({ text }: { text: string }) {
	const phrases = text.match(/[^、。]+[、。]?/g) ?? [text];
	let offset = 0;
	const segments = phrases.map(phrase => {
		const key = `${offset}:${phrase}`;
		offset += phrase.length;
		return { key, phrase };
	});
	return (
		<>
			{segments.map(({ key, phrase }) => (
				<span key={key} className={css({ display: "inline-block" })}>
					{phrase}
				</span>
			))}
		</>
	);
}

export default function AboutUs() {
	return (
		<section
			className={css({
				bg: "green.100",
				px: { base: "1.5rem", md: "2rem" },
				py: { base: "4rem", md: "6rem" },
			})}
		>
			<div className={css({ maxW: "760px", mx: "auto", w: "full", textAlign: "center" })}>
				<SectionHeading eyebrow="ABOUT" title="同窓会について" />

				<p
					className={css({
						color: "#1f4733",
						fontWeight: "500",
						fontSize: { base: "1.15rem", md: "1.4rem" },
						lineHeight: "1.9",
						textWrap: "balance",
					})}
				>
					<Phrased text={LEAD} />
				</p>

				<p
					className={css({
						mt: { base: "1.5rem", md: "2rem" },
						color: "#3f463f",
						lineHeight: "2.1",
						fontSize: { base: "0.95rem", md: "1rem" },
						textWrap: "pretty",
					})}
				>
					<Phrased text={BODY} />
				</p>

				<div
					className={css({
						mt: { base: "2.5rem", md: "3.25rem" },
						pt: { base: "1.75rem", md: "2rem" },
						borderTop: "1px solid token(colors.green.300)",
						maxW: { base: "340px", md: "440px" },
						mx: "auto",
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
					})}
				>
					{meta.map((item, index) => (
						<div
							key={item.id}
							className={css({
								display: "flex",
								justifyContent: "center",
								alignItems: "baseline",
								gap: "0.5rem",
								borderLeft: index === 0 ? "none" : "1px solid token(colors.green.300)",
							})}
						>
							<span
								className={css({
									color: "green.500",
									fontSize: { base: "0.8rem", md: "0.9rem" },
									fontWeight: "bold",
									letterSpacing: "0.08em",
								})}
							>
								{item.label}
							</span>
							<span
								className={css({
									color: "#1f4733",
									fontWeight: "bold",
									fontSize: { base: "1.25rem", md: "1.85rem" },
								})}
							>
								{item.value}
							</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
