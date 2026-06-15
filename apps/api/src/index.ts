import { Hono } from "hono";

const app = new Hono();

app.get("/", c => c.text("Hello World"));

const port = Number(process.env.PORT) || 3000;

export default {
	port,
	fetch: app.fetch,
};
