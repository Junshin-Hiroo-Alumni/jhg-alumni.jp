// /sitemap.xml を動的生成するリソースルート（HTMLではなくXMLを返す）。
// 固定ページ＋お知らせ詳細ページ（外部リンクのものは除外）を列挙する。
import { getAllNotices } from "~/lib/notice";
import { SITE_URL } from "~/lib/seo";

const staticPaths = ["/", "/about", "/notice", "/gallery", "/board-meeting", "/code"];

export function loader() {
	const notices = getAllNotices();
	const entries: { loc: string; lastmod?: string }[] = [
		...staticPaths.map(path => ({ loc: path })),
		// 詳細ページを持つお知らせのみ（href 付き＝外部PDF等は詳細ページが無いため除外）
		...notices
			.filter(notice => !notice.href)
			.map(notice => ({ loc: `/notice/${notice.slug}`, lastmod: notice.date || undefined })),
	];

	const urlXml = entries
		.map(entry => {
			const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
			return `<url><loc>${SITE_URL}${entry.loc}</loc>${lastmod}</url>`;
		})
		.join("\n");

	const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlXml}\n</urlset>\n`;

	return new Response(body, {
		headers: {
			"Content-Type": "application/xml; charset=utf-8",
			"Cache-Control": "public, max-age=3600",
		},
	});
}
