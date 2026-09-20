import { OpenAPIHono } from "@hono/zod-openapi";
import { route } from "./routes/ogimage";

// Keep the workspace contract derived from the same OpenAPI route definition
// without importing the renderer into consumers of the type-only package entry.
const app = new OpenAPIHono();
const appWithRoutes = app.openapi(route, (() => undefined) as never);

export type AppType = typeof appWithRoutes;
