import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { getOgImage } from "./lib/get-og-image";
import { route } from "./routes/ogimage";

const app = new OpenAPIHono();

const ogImageApp = app.openapi(route, async c => {
	// The body is validated by the OpenAPI route. Image generation is intentionally
	// kept independent from it until the renderer supports dynamic content.
	c.req.valid("param");
	c.req.valid("json");
	const ogimage = await getOgImage();
	return c.body(ogimage, 200, {
		"Content-Type": "image/png",
		"Cache-Control": "public, max-age=3600, s-maxage=86400",
	});
});

ogImageApp.doc("/openapi.json", {
	openapi: "3.2.0",
	info: {
		title: "OG Image API",
		version: "0.1.0",
		description: "Generate Open Graph images for the official site.",
	},
});

ogImageApp.get("/ui", swaggerUI({ url: "/openapi.json" }));

export type AppType = typeof ogImageApp;

export default ogImageApp;
