CREATE TABLE `questions` (
	`id` text PRIMARY KEY NOT NULL,
	`survey_id` text NOT NULL,
	`type` text DEFAULT 'text' NOT NULL,
	`question_text` text DEFAULT 'New Question' NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`options` text,
	`required` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`survey_id`) REFERENCES `surveys`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `surveys` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`title` text DEFAULT 'Untitled Survey' NOT NULL,
	`description` text,
	`primary_color` text DEFAULT '#3b82f6' NOT NULL,
	`logo_url` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
