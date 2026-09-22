import { feed } from "~/lib/feed.server";

export function loader() {
	return new Response(feed.rss2(), {
		headers: {
			"Cache-Control": "no-store",
			"Cloudflare-CDN-Cache-Control": "public, max-age=3600",
			"Content-Type": "application/rss+xml; charset=utf-8",
		},
	});
}
