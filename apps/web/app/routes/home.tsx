import AboutUs from "~/components/home/AboutUs";
import Contents from "~/components/home/Contents";
import Greeting from "~/components/home/Greeting";
import HeroImages from "~/components/home/HeroImages";
import NoticePreview from "~/components/home/NoticePreview";
import { ogImage } from "~/lib/og-image";
import { buildMeta, DEFAULT_DESCRIPTION, SITE_NAME } from "~/lib/seo";

export function meta() {
	return buildMeta({ path: "/", dynamicOg: true });
}

export const middleware = [
	ogImage(() => ({
		type: "landing",
		body: { title: SITE_NAME, description: DEFAULT_DESCRIPTION },
	})),
];

export default function Home() {
	return (
		<div>
			<HeroImages />
			<Greeting />
			<AboutUs />
			<NoticePreview />
			<Contents />
		</div>
	);
}
