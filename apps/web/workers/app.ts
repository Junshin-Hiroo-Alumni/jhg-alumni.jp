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

/**
 * 検索エンジンに載せない、会員・認証まわりのパス
 *
 * ページの meta robots はリダイレクトや `.data`（React Router のデータ取得）には付かないため、
 * レスポンスヘッダーでも指定する。`[/.]` で配下のページと `/login.data` のような URL を含める。
 */
const NOINDEX_PATH =
	/^\/(?:mypage|login|logout|register|forgot-password|reset-password|verify-email)(?:[/.]|$)/;

export default {
	fetch(request, env, ctx) {
		const context = new RouterContextProvider();
		context.set(cloudflareContext, { env, ctx });
		const noindex = NOINDEX_PATH.test(new URL(request.url).pathname);
		return requestHandler(request, context).then(response => {
			if (!noindex && response.headers.has("Cloudflare-CDN-Cache-Control")) {
				return response;
			}

			const headers = new Headers(response.headers);
			if (noindex) {
				headers.set("X-Robots-Tag", "noindex, nofollow");
			}
			if (!headers.has("Cloudflare-CDN-Cache-Control")) {
				headers.set("Cloudflare-CDN-Cache-Control", "no-store");
			}
			return new Response(response.body, {
				status: response.status,
				statusText: response.statusText,
				headers,
			});
		});
	},
} satisfies ExportedHandler<Env>;
