import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../db/client";
import { emailChanges, members } from "../db/schema";
import { sha256Hex } from "../lib/crypto";
import { errorResponse, jsonBody, jsonResponse } from "./common";

const INVALID_LINK_MESSAGE = "リンクが無効か、有効期限が切れています。";

// 確認メールのリンクはログインしていないブラウザで開かれることもあるため、トークンだけで確定できる

const getRoute = createRoute({
	method: "get",
	path: "/v1/email-changes",
	request: { query: z.object({ token: z.string() }) },
	responses: {
		200: jsonResponse("変更リンクが有効", z.object({ newEmail: z.string() })),
		404: errorResponse("リンクが無効または期限切れ"),
	},
});

const confirmRoute = createRoute({
	method: "post",
	path: "/v1/email-changes/confirm",
	request: jsonBody(z.object({ token: z.string() })),
	responses: {
		200: jsonResponse("メールアドレスを変更した", z.object({ email: z.string() })),
		404: errorResponse("リンクが無効または期限切れ"),
		409: errorResponse("ほかの会員が先にこのアドレスを使った"),
	},
});

async function findValidChange(token: string) {
	return await getDb().query.emailChanges.findFirst({
		where: and(
			eq(emailChanges.tokenHash, await sha256Hex(token)),
			gt(emailChanges.expiresAt, new Date()),
		),
	});
}

export const emailChangeApp = new OpenAPIHono()
	.openapi(getRoute, async c => {
		const change = await findValidChange(c.req.valid("query").token);
		if (!change) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		return c.json({ newEmail: change.newEmail }, 200);
	})
	.openapi(confirmRoute, async c => {
		const change = await findValidChange(c.req.valid("json").token);
		if (!change) {
			return c.json({ message: INVALID_LINK_MESSAGE }, 404);
		}
		const db = getDb();
		try {
			await db.batch([
				db.update(members).set({ email: change.newEmail }).where(eq(members.id, change.memberId)),
				db.delete(emailChanges).where(eq(emailChanges.memberId, change.memberId)),
			]);
		} catch (error) {
			// 申請後に、ほかの会員が同じアドレスで登録・変更していた場合（UNIQUE 制約違反）
			if (String(error).includes("UNIQUE")) {
				return c.json({ message: "このメールアドレスは既に使われています。" }, 409);
			}
			throw error;
		}
		return c.json({ email: change.newEmail }, 200);
	});
