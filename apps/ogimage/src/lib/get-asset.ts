import { env } from "cloudflare:workers";

export async function getAsset(path: string): Promise<Response> {
	return await env.ASSETS.fetch(`https://internal/${encodeURIComponent(path)}`);
}
