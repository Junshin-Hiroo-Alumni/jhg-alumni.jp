import { buildMeta } from "~/lib/seo";

export function meta() {
	return buildMeta({
		title: "このサイトについて",
		path: "/about",
		description:
			"順心広尾学園同窓会 公式サイトの概要と、本サイトで提供している情報についてご案内します。",
	});
}

export default function About() {
	return <h1>About</h1>;
}
