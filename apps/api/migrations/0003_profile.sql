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
ALTER TABLE `members` ADD `address` text;