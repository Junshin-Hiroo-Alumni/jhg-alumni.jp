import { createContext, createRequestHandler, RouterContextProvider } from "react-router";

// v8_middleware 有効時の load context。ローダー/ミドルウェアからは
// `context.get(cloudflareContext)` で env / ctx にアクセスできる。
export const cloudflareContext = createContext<{
	env: Env;
	ctx: ExecutionContext;
}>();

const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	fetch(request, env, ctx) {
		const context = new RouterContextProvider();
		context.set(cloudflareContext, { env, ctx });
		return requestHandler(request, context).then(response => {
			if (response.headers.has("Cache-Control")) {
				return response;
			}

			const headers = new Headers(response.headers);
			headers.set("Cache-Control", "no-store");
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		});
	},
} satisfies ExportedHandler<Env>;
