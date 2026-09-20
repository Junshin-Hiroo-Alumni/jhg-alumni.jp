import { env } from "cloudflare:workers";
import type { AppType } from "@repo/ogimage";
import type { InferRequestType } from "hono/client";
import { hc } from "hono/client";
import type { MiddlewareFunction, Params } from "react-router";

type OgImageEndpoint = ReturnType<typeof hc<AppType>>["v1"][":type"];
export type OgImageInput = InferRequestType<OgImageEndpoint["$query"]>["json"];
export type OgImageType = InferRequestType<OgImageEndpoint["$query"]>["param"]["type"];

export type OgImageRequest = {
	type: OgImageType;
	input: OgImageInput;
};

export type OgImageResolverArgs<T extends Params = Params> = {
	request: Request;
	url: URL;
	params: T;
};

export type OgImageResolver<T extends Params = Params> = (
	args: OgImageResolverArgs<T>,
) => OgImageRequest | null | Promise<OgImageRequest | null>;

/**
 * Add a route-local OG image definition to a server route.
 *
 * A regular page request continues through React Router. Requests marked with
 * ?og are handled here and call the single OG image Worker endpoint.
 */
export function ogImage<T extends Params = Params>(
	resolve: OgImageResolver<T>,
): MiddlewareFunction<Response> {
	return async ({ request, url, params }, next) => {
		const isOgImageRequest = new URL(request.url).searchParams.has("og");
		if (!isOgImageRequest) {
			return next();
		}
		if (request.method !== "GET" && request.method !== "HEAD") {
			return new Response("Method Not Allowed", {
				status: 405,
				// biome-ignore lint/style/useNamingConvention: HTTP header name
				headers: { Allow: "GET, HEAD", "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const input = await resolve({
			request,
			url,
			params: params as T,
		});
		if (!input) {
			return new Response("OG image is not configured", {
				status: 404,
				headers: { "Content-Type": "text/plain; charset=utf-8" },
			});
		}

		const ogImageBinding = (env as Record<string, Fetcher>).OG_IMAGE;
		const client = hc<AppType>("https://ogimage.internal", {
			fetch: ogImageBinding.fetch.bind(ogImageBinding),
		});
		const response = await client.v1[":type"].$query({
			param: { type: input.type },
			json: input.input,
		});

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
