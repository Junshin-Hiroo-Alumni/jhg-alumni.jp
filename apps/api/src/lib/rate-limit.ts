import type { Context } from "hono";

/**
 * 利用者の IP アドレス
 *
 * 公開 URL へのリクエストでは Cloudflare が設定する。Service Binding 経由の場合は
 * apps/web がブラウザの IP を転送する。
 */
export function clientIp(c: Context): string {
	return c.req.header("CF-Connecting-IP") ?? "unknown";
}

/** 上限を超えていれば false */
export async function withinRateLimit(limiter: RateLimit, key: string): Promise<boolean> {
	const { success } = await limiter.limit({ key });
	return success;
}
