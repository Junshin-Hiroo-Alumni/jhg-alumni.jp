import { loadDefaultJapaneseParser } from "budoux";
import { useEffect, useRef } from "react";
import { Outlet } from "react-router";
import { styled } from "styled-system/jsx";
import SiteFooter from "~/components/layout/SiteFooter";
import SiteHeader from "~/components/layout/SiteHeader";
import SiteLoader from "~/components/layout/SiteLoader";

const LayoutContainer = styled("div", {
	base: {
		bg: "gray.100",
		display: "flex",
		flexDirection: "column",
		minHeight: "100vh",
		fontFamily: "maru",
	},
});

const MainContent = styled("main", {
	base: { flex: 1 },
});

export default function SiteLayout() {
	const mainContent = useRef(null);
	useEffect(() => {
		if (document.documentElement.lang === "ja" && mainContent.current) {
			const parser = loadDefaultJapaneseParser();
			parser.applyToElement(mainContent.current);
		}
	}, []);
	return (
		<LayoutContainer>
			<SiteLoader />
			<SiteHeader />
			<MainContent ref={mainContent}>
				<Outlet />
			</MainContent>
			<SiteFooter />
		</LayoutContainer>
	);
}
