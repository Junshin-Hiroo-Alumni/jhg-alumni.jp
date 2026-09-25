// ローカル開発用に、サンプル会員（seed/dev.sql）の JWT を発行する。
// Swagger UI（/ui）の Authorize などで使う。
import { sign } from "hono/jwt";
import { DEV_JWT_SECRET, JWT_AUDIENCE, JWT_ISSUER } from "../src/lib/auth";

// bun が apps/api/.env を自動で読み込む
const secret = process.env.JWT_SECRET || DEV_JWT_SECRET;

const now = Math.floor(Date.now() / 1000);
const token = await sign(
	{
		sub: process.argv[2] ?? "00000000-0000-4000-8000-000000000001",
		iss: JWT_ISSUER,
		aud: JWT_AUDIENCE,
		iat: now,
		exp: now + 60 * 60,
	},
	secret,
	"HS256",
);
console.info(token);
