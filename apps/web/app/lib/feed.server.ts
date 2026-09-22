import { tz } from "@date-fns/tz";
import { parseISO } from "date-fns";
import { Feed } from "feed";
import { getLatestNotices } from "./notice";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "./seo";

const notices = getLatestNotices(10);
const updated = notices[0] ? parseISO(notices[0].date, { in: tz("Asia/Tokyo") }) : new Date();

const rssUrl = new URL("rss.xml", SITE_URL);
const atomUrl = new URL("atom.xml", SITE_URL);
const faviconUrl = new URL("favicon.ico", SITE_URL);

const feed = new Feed({
	title: SITE_NAME,
	id: SITE_URL,
	link: SITE_URL,
	description: DEFAULT_DESCRIPTION,
	favicon: faviconUrl.toString(),
	language: "ja",
	ttl: 1440,
	image: `${SITE_URL}?og`,
	updated,
	feedLinks: {
		rss: rssUrl.toString(),
		atom: atomUrl.toString(),
	},
	author: {
		name: "順心広尾学園同窓会",
		link: SITE_URL,
	},
});

for (const notice of notices) {
	const noticeUrl = new URL(`notice/${notice.slug}`, SITE_URL);
	const noticeOgUrl = new URL(noticeUrl);
	noticeOgUrl.searchParams.append("og", "1");

	const publishedAt = parseISO(notice.date, {
		in: tz("Asia/Tokyo"),
	});
	feed.addItem({
		title: notice.title,
		id: noticeUrl.toString(),
		link: notice.href ?? noticeUrl.toString(),
		description: notice.body,
		date: publishedAt,
		published: publishedAt,
		image: { url: noticeOgUrl.toString(), type: "image/png" },
	});
}

export { feed };
