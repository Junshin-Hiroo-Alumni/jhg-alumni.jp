import { createContext, type MiddlewareFunction, redirect } from "react-router";
import { createApiClient } from "./api.server";
import { deleteCookie, readCookie, serializeCookie } from "./cookies.server";

const ACCESS_TOKEN_COOKIE = "jhg_at";
const REFRESH_TOKEN_COOKIE = "jhg_rt";

type TokenPair = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	refreshExpiresIn: number;
};

/** ログイン後に発行されたトークンを Cookie に保存する Set-Cookie ヘッダー */
export function authCookieHeaders(tokens: TokenPair): Headers {
	const headers = new Headers();
	headers.append(
		"Set-Cookie",
		serializeCookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, { maxAge: tokens.expiresIn }),
	);
	headers.append(
		"Set-Cookie",
		serializeCookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
			maxAge: tokens.refreshExpiresIn,
		}),
	);
	return headers;
}

export function clearAuthCookieHeaders(): Headers {
	const headers = new Headers();
	headers.append("Set-Cookie", deleteCookie(ACCESS_TOKEN_COOKIE));
	headers.append("Set-Cookie", deleteCookie(REFRESH_TOKEN_COOKIE));
	return headers;
}

export function getRefreshToken(request: Request): string | undefined {
	return readCookie(request, REFRESH_TOKEN_COOKIE);
}

/** ログイン状態の目安（ヘッダーの表示切り替え用）。正しいかは API 側で検証する */
export function hasSession(request: Request): boolean {
	return getRefreshToken(request) !== undefined;
}

/** 署名は検証せず、有効期限（`exp`）が 30 秒以内に切れるかだけを見る */
function isExpiringSoon(jwt: string): boolean {
	try {
		const payload = JSON.parse(
			atob(jwt.split(".")[1]?.replace(/-/g, "+").replace(/_/g, "/") ?? ""),
		);
		return typeof payload.exp !== "number" || payload.exp * 1000 < Date.now() + 30_000;
	} catch {
		return true;
	}
}

export const memberSessionContext = createContext<{ accessToken: string }>();

/**
 * ログイン必須のページに付けるミドルウェア
 *
 * アクセストークンの期限が切れていればリフレッシュトークンで更新し、Cookie を書き換える。
 * ログインしていなければ /login へ移動する。
 */
export const requireMemberSession: MiddlewareFunction<Response> = async (
	{ request, context },
	next,
) => {
	let accessToken = readCookie(request, ACCESS_TOKEN_COOKIE);
	let refreshed: Headers | undefined;

	if (!accessToken || isExpiringSoon(accessToken)) {
		const refreshToken = getRefreshToken(request);
		if (!refreshToken) {
			throw redirect("/login");
		}
		const res = await createApiClient(request).v1.auth.refresh.$post({ json: { refreshToken } });
		if (res.status !== 200) {
			throw redirect("/login", { headers: clearAuthCookieHeaders() });
		}
		const tokens = await res.json();
		accessToken = tokens.accessToken;
		refreshed = authCookieHeaders(tokens);
	}

	context.set(memberSessionContext, { accessToken });
	const response = await next();
	for (const cookie of refreshed?.getSetCookie() ?? []) {
		response.headers.append("Set-Cookie", cookie);
	}
	return response;
};
