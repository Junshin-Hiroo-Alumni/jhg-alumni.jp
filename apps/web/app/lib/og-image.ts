import { env } from "cloudflare:workers";
import type { AppType } from "@repo/ogimage";
import type { InferRequestType } from "hono/client";
import { hc } from "hono/client";
import type { MiddlewareFunction, Params } from "react-router";

type OgImageClient = ReturnType<typeof hc<AppType>>;

export type OgImageRequest = {
	[K in keyof OgImageClient["v1"]]: {
		type: K;
		body: InferRequestType<OgImageClient["v1"][K]["$query"]>["json"];
	};
}[keyof OgImageClient["v1"]];

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

		const client = hc<AppType>("https://ogimage.internal", {
			fetch: env.OG_IMAGE.fetch.bind(env.OG_IMAGE),
		});

		let response: Awaited<ReturnType<OgImageClient["v1"]["landing"]["$query"]>>;
		switch (input.type) {
			case "landing":
				response = await client.v1.landing.$query({ json: input.body });
				break;
			case "news":
				response = await client.v1.news.$query({ json: input.body });
				break;
			case "gallery":
				response = await client.v1.gallery.$query({ json: input.body });
				break;
		}

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

		const headers = new Headers(response.headers);
		headers.set("Cache-Control", "no-store");
		headers.set("Cloudflare-CDN-Cache-Control", "public, max-age=86400");

		return new Response(request.method === "HEAD" ? null : response.body, {
			status: response.status,
			statusText: response.statusText,
			headers,
		});
	};
}
