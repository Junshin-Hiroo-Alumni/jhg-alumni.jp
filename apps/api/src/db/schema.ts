import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * 同窓会員
 *
 * ログイン機能は未実装。認証導入時は認証側のユーザーとこの `id` を紐づける。
 */
export const members = sqliteTable("members", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	email: text("email").notNull().unique(),
	name: text("name").notNull(),
	graduationYear: integer("graduation_year"),
	createdAt: integer("created_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer("updated_at", { mode: "timestamp_ms" })
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export type Member = typeof members.$inferSelect;
