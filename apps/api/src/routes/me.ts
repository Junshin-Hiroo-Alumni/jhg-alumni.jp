import { createRoute, z } from "@hono/zod-openapi";

export const MemberSchema = z
	.object({
		id: z.string(),
		email: z.email(),
		name: z.string(),
		graduationYear: z.int().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
	})
	.openapi("Member");

const ErrorSchema = z.object({ message: z.string() }).openapi("Error");

const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ErrorSchema } },
});

const security = [{ bearerAuth: [] }];

export const getMeRoute = createRoute({
	method: "get",
	path: "/v1/me",
	security,
	responses: {
		200: {
			description: "ログイン中の会員",
			content: { "application/json": { schema: MemberSchema } },
		},
		401: errorResponse("トークンがない、または無効"),
		404: errorResponse("会員が存在しない"),
	},
});

export const updateMeRoute = createRoute({
	method: "patch",
	path: "/v1/me",
	security,
	request: {
		body: {
			required: true,
			content: {
				"application/json": {
					schema: z
						.object({
							name: z.string().trim().min(1).max(100),
							graduationYear: z.int().min(1900).max(2100).nullable(),
						})
						.partial(),
				},
			},
		},
	},
	responses: {
		200: {
			description: "更新後の会員",
			content: { "application/json": { schema: MemberSchema } },
		},
		401: errorResponse("トークンがない、または無効"),
		404: errorResponse("会員が存在しない"),
	},
});
