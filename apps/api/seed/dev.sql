-- ローカル開発用の登録済み会員（認証コード B4GS-7FZ2-UK9A）。`bun run db:seed` で投入する。
-- メールアドレス: jiro@example.com / パスワード: password123
INSERT OR IGNORE INTO members (id, member_code, email, password_hash, name, graduation_year, created_at, updated_at)
VALUES (
	'00000000-0000-4000-8000-000000000001',
	'B4GS7FZ2UK9A',
	'jiro@example.com',
	'pbkdf2-sha256$100000$iAkEAmPfiqzA_5M8kMdDng$NezrmUVhTJ77pPbedvNhg2aeV7WV0t3tTvNVLOfvOAE',
	'青山 次郎',
	2020,
	unixepoch('now') * 1000,
	unixepoch('now') * 1000
);
