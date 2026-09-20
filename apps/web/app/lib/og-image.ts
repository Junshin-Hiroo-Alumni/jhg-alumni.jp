import { hc } from "hono/client";
import type { InferRequestType } from "hono/client";
import type { MiddlewareFunction, Params } from "react-router";
import type { AppType } from "@repo/ogimage";
import { cloudflareContext } from "~/lib/cloudflare-context";

type OgImageEndpoint = ReturnType<typeof hc<AppType>>["v1"]["og"];
export type OgImageInput = InferRequestType<OgImageEndpoint["$query"]>["json"];

export type OgImageResolverArgs<TParams extends Params = Params> = {
	request: Request;
	url: URL;
	params: TParams;
};

export type OgImageResolver<TParams extends Params = Params> = (
	args: OgImageResolverArgs<TParams>,
) => OgImageInput | null | Promise<OgImageInput | null>;

/**
 * Add a route-local OG image definition to a server route.
 *
 * A regular page request continues through React Router. Requests marked with
 * ?og are handled here and call the single OG image Worker endpoint.
 */
export function ogImage<TParams extends Params = Params>(
	resolve: OgImageResolver<TParams>,
): MiddlewareFunction<Response> {
	return async ({ request, url, params, context }, next) => {
		const isOgImageRequest = new URL(request.url).searchParams.has("og");
		if (!isOgImageRequest) {
			return next();
		}
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", {
				status: 405,
				headers: { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const input = await resolve({
			request,
			url,
			params: params as TParams,
		});
		if (!input) {
			return new Response("OG image is not configured", {
				status: 404,
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const { env } = context.get(cloudflareContext);
		const client = hc<AppType>("https://ogimage.internal", {
			fetch: env.OG_IMAGE.fetch.bind(env.OG_IMAGE),
		});
		const response = await client.v1.og.$query({ json: input });

		if (!response.ok) {
			return new Response("OG image service failed", {
				status: 502,
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const contentType = response.headers.get("Content-Type")?.toLowerCase();
		if (!contentType?.startsWith("image/")) {
			return new Response("OG image service returned a non-image response", {
				status: 502,
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		return new Response(request.method === "HEAD" ? null : response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		});
	};
}
