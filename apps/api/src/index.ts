import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { getDb } from "./db/client";
import { type Member, members } from "./db/schema";
import { type AuthEnv, requireAuth } from "./lib/auth";
import { getMeRoute, updateMeRoute } from "./routes/me";

const app = new OpenAPIHono<AuthEnv>();

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
});

function toMemberResponse(member: Member) {
	return {
		...member,
		createdAt: member.createdAt.toISOString(),
		updatedAt: member.updatedAt.toISOString(),
	};
}

function findMember(id: string) {
	return getDb().query.members.findFirst({ where: eq(members.id, id) });
}

app.use("/v1/me", requireAuth);

const apiApp = app
	.openapi(getMeRoute, async c => {
		const member = await findMember(c.var.memberId);
		if (!member) {
			return c.json({ message: "Member not found" }, 404);
		}
		return c.json(toMemberResponse(member), 200);
	})
	.openapi(updateMeRoute, async c => {
		const body = c.req.valid("json");
		// 更新項目がない場合、Drizzle の update は空の SET で失敗するため現在値を返す
		const member =
			Object.keys(body).length === 0
				? await findMember(c.var.memberId)
				: (
						await getDb()
							.update(members)
							.set(body)
							.where(eq(members.id, c.var.memberId))
							.returning()
					)[0];
		if (!member) {
			return c.json({ message: "Member not found" }, 404);
		}
		return c.json(toMemberResponse(member), 200);
	});

export type AppType = typeof apiApp;

apiApp.doc("/openapi.json", {
	openapi: "3.2.0",
	info: {
		title: "Alumni API",
		version: "0.1.0",
		description: "Internal API for member pages of the official site.",
	},
});

apiApp.get("/ui", swaggerUI({ url: "/openapi.json" }));

export default apiApp;
