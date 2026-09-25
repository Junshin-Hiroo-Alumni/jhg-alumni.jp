import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	//サイトマップ
	route("sitemap.xml", "routes/sitemap.tsx"),
	route("rss.xml", "routes/rss.tsx"),
	route("atom.xml", "routes/atom.tsx"),
	route("logout", "routes/logout.tsx"),
	layout("layouts/site-layout.tsx", [
		index("routes/home.tsx"),
		route("about", "routes/about.tsx"),
		route("notice", "routes/notice/index.tsx"),
		route("notice/:noticeTitle", "routes/notice/[noticeTitle].tsx"),
		route("gallery", "routes/gallery.tsx"),
		route("gallery/:groupId", "routes/gallery/[groupId].tsx"),
		route("board-meeting", "routes/board-meeting.tsx"),
		route("code", "routes/code.tsx"),
	]),
	// マイページはサイトのヘッダー・フッターを使わず、独自のダッシュボードレイアウトにする
	route("mypage", "routes/mypage/layout.tsx", [
		index("routes/mypage/index.tsx"),
		route("profile", "routes/mypage/profile.tsx"),
	]),
	layout("layouts/auth-layout.tsx", [
		route("login", "routes/login.tsx"),
		route("forgot-password", "routes/forgot-password.tsx"),
		route("reset-password", "routes/reset-password.tsx"),
		route("verify-email", "routes/verify-email.tsx"),
		route("register", "routes/register/index.tsx"),
		route("register/confirm", "routes/register/confirm.tsx"),
		route("register/quiz", "routes/register/quiz.tsx"),
		route("register/email", "routes/register/email.tsx"),
		route("register/email-sent", "routes/register/email-sent.tsx"),
		route("register/verify", "routes/register/verify.tsx"),
	]),
] satisfies RouteConfig;
