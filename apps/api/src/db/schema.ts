import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });
const createdAt = () =>
	timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date());

/** 同窓会員。会員登録（メールアドレス確認とパスワード設定）が完了した時点で作成する */
export const members = sqliteTable("members", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	/** 登録に使った認証コード。1 つのコードで登録できるのは 1 人まで */
	memberCode: text("member_code").notNull().unique(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	name: text("name").notNull(),
	graduationYear: integer("graduation_year"),
	/** 住所（任意）。登録時は空 */
	address: text("address"),
	createdAt: createdAt(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export const REGISTRATION_STAGES = [
	"code_verified",
	"confirmed",
	"quiz_passed",
	"email_sent",
	"completed",
] as const;
export type RegistrationStage = (typeof REGISTRATION_STAGES)[number];

/**
 * 会員登録の途中経過
 *
 * 認証コードの確認で作成し、登録チケット（ハッシュのみ保存）で本人のブラウザと紐づける。
 * 段階（`stage`）をサーバー側で管理し、クイズなどを飛ばせないようにする。
 */
export const registrations = sqliteTable(
	"registrations",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ticketHash: text("ticket_hash").notNull().unique(),
		memberCode: text("member_code").notNull(),
		stage: text("stage", { enum: REGISTRATION_STAGES }).notNull(),
		/** 出題中の問題 ID（JSON 配列）。不正解のたびに作り直す */
		quizQuestionIds: text("quiz_question_ids", { mode: "json" }).$type<string[]>(),
		quizFailures: integer("quiz_failures").notNull().default(0),
		email: text("email"),
		emailTokenHash: text("email_token_hash").unique(),
		emailTokenExpiresAt: timestamp("email_token_expires_at"),
		emailSentAt: timestamp("email_sent_at"),
		emailSendCount: integer("email_send_count").notNull().default(0),
		/** 登録チケットの有効期限 */
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: createdAt(),
	},
	table => [index("registrations_member_code_idx").on(table.memberCode, table.createdAt)],
);

/** ログイン中のセッション（リフレッシュトークン。ハッシュのみ保存） */
export const sessions = sqliteTable(
	"sessions",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: createdAt(),
	},
	table => [index("sessions_member_id_idx").on(table.memberId)],
);

export type Member = typeof members.$inferSelect;
export type Registration = typeof registrations.$inferSelect;

/** パスワード再設定の申請（トークンはハッシュのみ保存） */
export const passwordResets = sqliteTable(
	"password_resets",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: createdAt(),
	},
	table => [index("password_resets_member_id_idx").on(table.memberId, table.createdAt)],
);

/** メールアドレス変更の申請。新しいアドレスに届いたリンクを開くと確定する */
export const emailChanges = sqliteTable(
	"email_changes",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		memberId: text("member_id")
			.notNull()
			.references(() => members.id, { onDelete: "cascade" }),
		newEmail: text("new_email").notNull(),
		tokenHash: text("token_hash").notNull().unique(),
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: createdAt(),
	},
	table => [index("email_changes_member_id_idx").on(table.memberId, table.createdAt)],
);
