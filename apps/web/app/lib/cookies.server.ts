export function readCookie(request: Request, name: string): string | undefined {
	const header = request.headers.get("Cookie");
	if (!header) {
		return undefined;
	}
	for (const part of header.split(";")) {
		const [key, ...value] = part.trim().split("=");
		if (key === name) {
			return decodeURIComponent(value.join("="));
		}
	}
	return undefined;
}

/** JavaScript から読めない（HttpOnly）、HTTPS のみ（Secure）の Cookie */
export function serializeCookie(
	name: string,
	value: string,
	options: { maxAge: number; path?: string },
): string {
	return [
		`${name}=${encodeURIComponent(value)}`,
		`Path=${options.path ?? "/"}`,
		`Max-Age=${Math.floor(options.maxAge)}`,
		"HttpOnly",
		"Secure",
		"SameSite=Lax",
	].join("; ");
}

export function deleteCookie(name: string, path = "/"): string {
	return serializeCookie(name, "", { maxAge: 0, path });
}
