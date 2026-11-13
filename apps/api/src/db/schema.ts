import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamp = (name: string) => integer(name, { mode: "timestamp_ms" });
const createdAt = () =>
	timestamp("created_at")
		.notNull()
		.$defaultFn(() => new Date());

/**
 * 同窓会名簿（認証コードを発行した人だけ）
 *
 * 事務局から受け取る CSV を `bun run roster:import` で取り込む。
 * 認証コードはハッシュだけを保存し、名簿が漏れてもコードを使えないようにする。
 */
export const roster = sqliteTable("roster", {
	memberNo: text("member_no").primaryKey(),
	codeHash: text("code_hash").notNull().unique(),
	/** 卒業した年（西暦）。卒業年度ではない。中学卒業（名簿に卒年がない）は null */
	graduationYear: integer("graduation_year"),
	name: text("name").notNull(),
	/** 旧姓・旧名で組み立てた名前。どちらもなければ null */
	formerName: text("former_name"),
	/** 取り込みのたびに更新し、CSV から消えた行を削除する目印にする */
	importedAt: timestamp("imported_at").notNull(),
});

/** 同窓会員。会員登録（メールアドレス確認とパスワード設定）が完了した時点で作成する */
export const members = sqliteTable("members", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	/** 名簿の会員番号。1 つの会員番号で登録できるのは 1 人まで */
	memberNo: text("member_no").notNull().unique(),
	email: text("email").notNull().unique(),
	passwordHash: text("password_hash").notNull(),
	name: text("name").notNull(),
	/** 中学卒業は null */
	graduationYear: integer("graduation_year"),
	/** 利用規約とプライバシーポリシーに同意した日時。同意の仕組みを入れる前に登録した会員は null */
	termsAgreedAt: timestamp("terms_agreed_at"),
	createdAt: createdAt(),
	updatedAt: timestamp("updated_at")
		.notNull()
		.$defaultFn(() => new Date())
		.$onUpdateFn(() => new Date()),
});

export const REGISTRATION_STAGES = [
	"code_verified",
	"year_verified",
	"confirmed",
	"email_sent",
	"completed",
] as const;
export type RegistrationStage = (typeof REGISTRATION_STAGES)[number];

/**
 * 会員登録の途中経過
 *
 * 認証コードの確認で作成し、登録チケット（ハッシュのみ保存）で本人のブラウザと紐づける。
 * 段階（`stage`）をサーバー側で管理し、卒業年の照合などを飛ばせないようにする。
 */
export const registrations = sqliteTable(
	"registrations",
	{
		id: text("id")
			.primaryKey()
			.$defaultFn(() => crypto.randomUUID()),
		ticketHash: text("ticket_hash").notNull().unique(),
		memberNo: text("member_no").notNull(),
		stage: text("stage", { enum: REGISTRATION_STAGES }).notNull(),
		yearFailures: integer("year_failures").notNull().default(0),
		email: text("email"),
		emailTokenHash: text("email_token_hash").unique(),
		emailTokenExpiresAt: timestamp("email_token_expires_at"),
		emailSentAt: timestamp("email_sent_at"),
		emailSendCount: integer("email_send_count").notNull().default(0),
		/** 登録チケットの有効期限 */
		expiresAt: timestamp("expires_at").notNull(),
		createdAt: createdAt(),
	},
	table => [index("registrations_member_no_idx").on(table.memberNo, table.createdAt)],
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
export type RosterEntry = typeof roster.$inferSelect;
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
