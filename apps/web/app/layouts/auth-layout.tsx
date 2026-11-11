import { Outlet } from "react-router";
import { styled } from "styled-system/jsx";
import SiteLogo from "~/components/layout/SiteLogo";

const LayoutContainer = styled("div", {
	base: {
		bg: "gray.100",
		minHeight: "100vh",
		fontFamily: "maru",
	},
});

/** ログイン・会員登録用のレイアウト。メニューとフッターを出さず、ロゴだけを表示する */
export default function AuthLayout() {
	return (
		<LayoutContainer>
			<SiteLogo />
			<main>
				<Outlet />
			</main>
		</LayoutContainer>
	);
}
