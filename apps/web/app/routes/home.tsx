import AboutUs from "~/components/home/AboutUs";
import Contents from "~/components/home/Contents";
import Greeting from "~/components/home/Greeting";
import HeroImages from "~/components/home/HeroImages";
import NoticePreview from "~/components/home/NoticePreview";
import { buildMeta } from "~/lib/seo";

export function meta() {
	return buildMeta({ path: "/" });
}

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
