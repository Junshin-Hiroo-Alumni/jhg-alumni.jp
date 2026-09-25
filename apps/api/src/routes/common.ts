import { z } from "@hono/zod-openapi";

export const ErrorSchema = z.object({ message: z.string() }).openapi("Error");

export const errorResponse = (description: string) => ({
	description,
	content: { "application/json": { schema: ErrorSchema } },
});

export const jsonResponse = <T extends z.ZodType>(description: string, schema: T) => ({
	description,
	content: { "application/json": { schema } },
});

export const jsonBody = <T extends z.ZodType>(schema: T) => ({
	body: { required: true, content: { "application/json": { schema } } },
});

export const bearerSecurity = [{ bearerAuth: [] }];
export const registrationSecurity = [{ registrationTicket: [] }];

export const TokenPairSchema = z
	.object({
		accessToken: z.string(),
		refreshToken: z.string(),
		expiresIn: z.int().openapi({ description: "アクセストークンの有効期間（秒）" }),
		refreshExpiresIn: z.int().openapi({ description: "リフレッシュトークンの有効期間（秒）" }),
	})
	.openapi("TokenPair");

export const PasswordSchema = z.string().min(8).max(128).openapi({ description: "8〜128 文字" });
