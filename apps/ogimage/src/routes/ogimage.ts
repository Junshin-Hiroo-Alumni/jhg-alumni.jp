import { createRoute, z } from "@hono/zod-openapi";

export const OgImageBodySchema = z.object({
	title: z.string().trim().min(1),
	description: z.string().trim().optional(),
});

export const route = createRoute({
	method: "query",
	path: "/v1/og",
	request: {
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
