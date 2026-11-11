import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { authApp } from "./routes/auth";
import { emailChangeApp } from "./routes/email-change";
import { meApp } from "./routes/me";
import { passwordResetApp } from "./routes/password-reset";
import { REGISTRATION_TICKET_HEADER, registrationsApp } from "./routes/registrations";

const app = new OpenAPIHono();

app.openAPIRegistry.registerComponent("securitySchemes", "bearerAuth", {
	type: "http",
	scheme: "bearer",
	bearerFormat: "JWT",
});
app.openAPIRegistry.registerComponent("securitySchemes", "registrationTicket", {
	type: "apiKey",
	in: "header",
	name: REGISTRATION_TICKET_HEADER,
});

const apiApp = app
	.route("/", meApp)
	.route("/", authApp)
	.route("/", passwordResetApp)
	.route("/", emailChangeApp)
	.route("/", registrationsApp);

export type AppType = typeof apiApp;

apiApp.doc("/openapi.json", {
	openapi: "3.2.0",
	info: {
		title: "Alumni API",
		version: "0.1.0",
		description: "会員登録・ログイン・会員情報の API",
	},
});

apiApp.get("/ui", swaggerUI({ url: "/openapi.json" }));

export default apiApp;
