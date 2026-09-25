-- 公開前のため、サンプルデータしかない members は作り直す（NOT NULL 列を ALTER TABLE で追加できないため）
DROP TABLE `members`;
--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_code` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`graduation_year` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_code_unique` ON `members` (`member_code`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_hash` text NOT NULL,
	`member_code` text NOT NULL,
	`stage` text NOT NULL,
	`quiz_question_ids` text,
	`quiz_failures` integer DEFAULT 0 NOT NULL,
	`email` text,
	`email_token_hash` text,
	`email_token_expires_at` integer,
	`email_sent_at` integer,
	`email_send_count` integer DEFAULT 0 NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_ticket_hash_unique` ON `registrations` (`ticket_hash`);--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_email_token_hash_unique` ON `registrations` (`email_token_hash`);--> statement-breakpoint
CREATE INDEX `registrations_member_code_idx` ON `registrations` (`member_code`,`created_at`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_member_id_idx` ON `sessions` (`member_id`);--> statement-breakpoint
