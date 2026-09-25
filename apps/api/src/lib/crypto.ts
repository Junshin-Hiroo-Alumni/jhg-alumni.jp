const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
	const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
	return Uint8Array.from(atob(base64), char => char.charCodeAt(0));
}

/** 推測できないランダムなトークン（256bit） */
export function randomToken(): string {
	return toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

/** トークンを DB に保存するときのハッシュ。トークン自体は保存しない */
export async function sha256Hex(value: string): Promise<string> {
	const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
	return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/** 暗号論的に安全な乱数でシャッフルした新しい配列を返す */
export function secureShuffle<T>(items: readonly T[]): T[] {
	const result = [...items];
	for (let i = result.length - 1; i > 0; i--) {
		const [random = 0] = crypto.getRandomValues(new Uint32Array(1));
		const j = random % (i + 1);
		[result[i], result[j]] = [result[j] as T, result[i] as T];
	}
	return result;
}

// Workers の WebCrypto で指定できる PBKDF2 の反復回数は最大 100,000
const PBKDF2_ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, [
		"deriveBits",
	]);
	const bits = await crypto.subtle.deriveBits(
		{ name: "PBKDF2", hash: "SHA-256", salt, iterations },
		key,
		256,
	);
	return new Uint8Array(bits);
}

/** `pbkdf2-sha256$<反復回数>$<salt>$<hash>` 形式で返す */
export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
	return `pbkdf2-sha256$${PBKDF2_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
	if (a.length !== b.length) {
		return false;
	}
	let diff = 0;
	for (let i = 0; i < a.length; i++) {
		diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
	}
	return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [scheme, iterations, salt, hash] = stored.split("$");
	if (scheme !== "pbkdf2-sha256" || !iterations || !salt || !hash) {
		return false;
	}
	const actual = await pbkdf2(password, fromBase64Url(salt), Number(iterations));
	return timingSafeEqual(actual, fromBase64Url(hash));
}

/** 存在しないメールアドレスでも応答時間を揃えるために使うダミーのハッシュ */
export const DUMMY_PASSWORD_HASH =
	"pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
