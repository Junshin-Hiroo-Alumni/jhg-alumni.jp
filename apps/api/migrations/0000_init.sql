CREATE TABLE `email_changes` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`new_email` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_changes_token_hash_unique` ON `email_changes` (`token_hash`);--> statement-breakpoint
CREATE INDEX `email_changes_member_id_idx` ON `email_changes` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` text PRIMARY KEY NOT NULL,
	`member_no` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`name` text NOT NULL,
	`graduation_year` integer,
	`address` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_member_no_unique` ON `members` (`member_no`);--> statement-breakpoint
CREATE UNIQUE INDEX `members_email_unique` ON `members` (`email`);--> statement-breakpoint
CREATE TABLE `password_resets` (
	`id` text PRIMARY KEY NOT NULL,
	`member_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_resets_token_hash_unique` ON `password_resets` (`token_hash`);--> statement-breakpoint
CREATE INDEX `password_resets_member_id_idx` ON `password_resets` (`member_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `registrations` (
	`id` text PRIMARY KEY NOT NULL,
	`ticket_hash` text NOT NULL,
	`member_no` text NOT NULL,
	`stage` text NOT NULL,
	`year_failures` integer DEFAULT 0 NOT NULL,
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
CREATE INDEX `registrations_member_no_idx` ON `registrations` (`member_no`,`created_at`);--> statement-breakpoint
CREATE TABLE `roster` (
	`member_no` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`graduation_year` integer,
	`name` text NOT NULL,
	`former_name` text,
	`imported_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `roster_code_hash_unique` ON `roster` (`code_hash`);--> statement-breakpoint
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
CREATE INDEX `sessions_member_id_idx` ON `sessions` (`member_id`);