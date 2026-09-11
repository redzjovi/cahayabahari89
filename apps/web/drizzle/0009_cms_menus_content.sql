CREATE TABLE `menus` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`location` text DEFAULT 'header' NOT NULL,
	`label_en` text DEFAULT '' NOT NULL,
	`label_id` text DEFAULT '' NOT NULL,
	`href` text DEFAULT '/' NOT NULL,
	`sort` integer DEFAULT 0 NOT NULL,
	`visible` integer DEFAULT 1 NOT NULL,
	`created_at` text DEFAULT (datetime('now')),
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `menus_location_idx` ON `menus` (`location`);--> statement-breakpoint
CREATE INDEX `menus_sort_idx` ON `menus` (`sort`);--> statement-breakpoint
CREATE TABLE `page_sections` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`page` text NOT NULL,
	`locale` text DEFAULT 'id' NOT NULL,
	`key` text NOT NULL,
	`heading` text,
	`body` text,
	`image_url` text,
	`sort` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE INDEX `page_sections_page_locale_idx` ON `page_sections` (`page`,`locale`);--> statement-breakpoint
CREATE INDEX `page_sections_key_idx` ON `page_sections` (`key`);