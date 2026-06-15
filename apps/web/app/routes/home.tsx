import AboutUs from "~/components/home/AboutUs";
import Contents from "~/components/home/Contents";
import Greeting from "~/components/home/Greeting";
import HeroImages from "~/components/home/HeroImages";
import NoticePreview from "~/components/home/NoticePreview";

export function meta() {
	return [{ title: "順心広尾学園同窓会" }];
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
