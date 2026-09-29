import { env } from "cloudflare:workers";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import toppageImage from "./assets/toppage.png";
import { getOgImage } from "./lib/get-og-image";
import { galleryRoute, landingRoute, newsRoute } from "./routes/ogimage";

const app = new OpenAPIHono();

const cacheHeaders = {
	"Cache-Control": "no-store",
	"Cloudflare-CDN-Cache-Control": "public, max-age=86400",
} as const;

const ogImageApp = app
	.openapi(landingRoute, async c => {
		const ogimage = await (await env.ASSETS.fetch(new URL(toppageImage, c.req.url))).arrayBuffer();
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			...cacheHeaders,
		});
	})
	.openapi(newsRoute, async c => {
		const body = c.req.valid("json");
		const ogimage = await getOgImage({
			type: "news",
			data: body,
		});
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			...cacheHeaders,
		});
	})
	.openapi(galleryRoute, async c => {
		const body = c.req.valid("json");
		const ogimage = await getOgImage({
			type: "gallery",
			data: body,
		});
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			...cacheHeaders,
		});
	});

export type AppType = typeof ogImageApp;

ogImageApp.doc("/openapi.json", {
	openapi: "3.2.0",
	info: {
		title: "OG Image API",
		version: "0.1.0",
		description: "Generate Open Graph images for the official site.",
	},
});

ogImageApp.get("/ui", swaggerUI({ url: "/openapi.json" }));

export default ogImageApp;
