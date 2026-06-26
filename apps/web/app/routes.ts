import { index, layout, type RouteConfig, route } from "@react-router/dev/routes";

export default [
	//サイトマップ
	route("sitemap.xml", "routes/sitemap.tsx"),
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
] satisfies RouteConfig;
