import { createRoute, z } from "@hono/zod-openapi";

export const landingRoute = createRoute({
	method: "query",
	path: "/v1/landing",
	request: {
		body: {
			required: false,
			content: { "application/json": { schema: z.object({}) } },
		},
	},
	responses: {
		200: {
			description: "OG image",
			content: {
				"image/png": {
					schema: z.string().openapi({ format: "binary" }),
				},
			},
		},
	},
});

export const newsRoute = createRoute({
	method: "query",
	path: "/v1/news",
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: z.object({
						title: z.string(),
						description: z.string().optional(),
						publishedAt: z.iso.datetime(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "OG image",
			content: {
				"image/png": {
					schema: z.string().openapi({ format: "binary" }),
				},
			},
		},
	},
});

export const galleryRoute = createRoute({
	method: "query",
	path: "/v1/gallery",
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: z.object({
						title: z.string(),
						description: z.string().optional(),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: "OG image",
			content: {
				"image/png": {
					schema: z.string().openapi({ format: "binary" }),
				},
			},
		},
	},
});
