-- ローカル D1 のデータをすべて削除する（テーブルは残す）。`bun run db:reset` で実行する。
DELETE FROM sessions;
DELETE FROM password_resets;
DELETE FROM email_changes;
DELETE FROM registrations;
DELETE FROM members;
