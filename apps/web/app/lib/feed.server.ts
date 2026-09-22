import { tz } from "@date-fns/tz";
import { isValid, parseISO } from "date-fns";
import { Feed } from "feed";
import { getLatestNotices, getNoticeDescription } from "./notice";
import { DEFAULT_DESCRIPTION, SITE_NAME, SITE_URL } from "./seo";

const notices = getLatestNotices(10)
	.map(notice => ({
		...notice,
		publishedAt: parseISO(notice.date, { in: tz("Asia/Tokyo") }),
	}))
	.filter(notice => isValid(notice.publishedAt));

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
	updated: notices[0]?.publishedAt ?? new Date(),
	feedLinks: {
		rss: rssUrl.toString(),
		atom: atomUrl.toString(),
	},
	author: {
		name: "順心広尾学園同窓会",
		link: SITE_URL,
	},
});

for (const { publishedAt, ...notice } of notices) {
	const noticeUrl = new URL(`notice/${notice.slug}`, SITE_URL);
	const noticeOgUrl = new URL(noticeUrl);
	noticeOgUrl.searchParams.append("og", "1");

	feed.addItem({
		title: notice.title,
		id: noticeUrl.toString(),
		link: notice.href ?? noticeUrl.toString(),
		description: getNoticeDescription(notice),
		date: publishedAt,
		published: publishedAt,
		image: { url: noticeOgUrl.toString(), type: "image/png" },
	});
}

export { feed };
