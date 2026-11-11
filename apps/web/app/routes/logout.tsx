import { redirect } from "react-router";
import { createApiClient } from "~/lib/api.server";
import { clearAuthCookieHeaders, getRefreshToken } from "~/lib/session.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
	const refreshToken = getRefreshToken(request);
	if (refreshToken) {
		await createApiClient(request).v1.auth.logout.$post({ json: { refreshToken } });
	}
	return redirect("/login", { headers: clearAuthCookieHeaders() });
}

export function loader() {
	return redirect("/mypage");
}
