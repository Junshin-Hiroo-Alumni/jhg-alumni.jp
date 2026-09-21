import { ogImage } from "~/lib/og-image";
import { buildMeta } from "~/lib/seo";

const TITLE = "このサイトについて";
const DESCRIPTION =
	"順心広尾学園同窓会 公式サイトの概要と、本サイトで提供している情報についてご案内します。";

export const middleware = [
	ogImage(() => ({
		type: "news",
		body: { title: TITLE, description: DESCRIPTION },
	})),
];

export function meta() {
	return buildMeta({
		title: TITLE,
		path: "/about",
		description: DESCRIPTION,
		dynamicOg: true,
	});
}

export default function About() {
	return <h1>About</h1>;
}
