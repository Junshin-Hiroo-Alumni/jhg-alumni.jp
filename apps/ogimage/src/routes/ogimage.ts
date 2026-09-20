import { createRoute, z } from "@hono/zod-openapi";

const ParamsSchema = z.object({
	type: z.enum(["landing", "news", "gallery"]),
});

export const OgImageBodySchema = z.object({
	title: z.string().trim().min(1),
	description: z.string().trim().optional(),
});

export const route = createRoute({
	method: "query",
	path: "/v1/{type}",
	request: {
		params: ParamsSchema,
		body: {
			required: true,
			content: {
				"application/json": {
					schema: OgImageBodySchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: "OG image",
			content: {
				"image/png": {
					schema: z.any().openapi({
						type: "string",
						format: "binary",
					}),
				},
			},
		},
	},
});
