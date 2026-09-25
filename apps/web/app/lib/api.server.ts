import { env } from "cloudflare:workers";
import type { AppType } from "@repo/api";
import { hc } from "hono/client";

export type ApiClient = ReturnType<typeof hc<AppType>>;

/**
 * `apps/api` を呼ぶ型付き Hono Client
 *
 * Service Binding 経由で呼ぶため、loader / action などサーバー側からのみ使う。
 */
export function createApiClient(
	request: Request,
	options: { accessToken?: string; registrationTicket?: string } = {},
): ApiClient {
	const headers: Record<string, string> = {};
	// API 側のレート制限をブラウザの IP ごとにかけるため転送する
	const ip = request.headers.get("CF-Connecting-IP");
	if (ip) {
		headers["CF-Connecting-IP"] = ip;
	}
	if (options.accessToken) {
		headers.Authorization = `Bearer ${options.accessToken}`;
	}
	if (options.registrationTicket) {
		headers["X-Registration-Ticket"] = options.registrationTicket;
	}
	return hc<AppType>("https://api.internal", {
		fetch: env.API.fetch.bind(env.API),
		headers,
	});
}
