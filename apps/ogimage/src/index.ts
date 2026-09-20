import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getAsset } from "./lib/get-asset";
import { getOgImage } from "./lib/get-og-image";
import { galleryRoute, landingRoute, newsRoute } from "./routes/ogimage";

const app = new OpenAPIHono();

const ogImageApp = app
	.openapi(landingRoute, async c => {
		const ogimage = await (await getAsset("toppage.png")).arrayBuffer();
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		});
	})
	.openapi(newsRoute, async c => {
		const body = c.req.valid("json");
		const ogimage = await getOgImage({ type: "news", data: body });
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
		});
	})
	.openapi(galleryRoute, async c => {
		c.req.valid("json");
		const ogimage = await getOgImage({ type: "gallery", data: null });
		return c.body(ogimage, 200, {
			"Content-Type": "image/png",
			"Cache-Control": "public, max-age=3600, s-maxage=86400",
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
