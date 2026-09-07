-- Add updated_at to products (nullable, no DEFAULT — SQLite/D1 rejects non-constant
-- defaults in ALTER TABLE ADD COLUMN). The Drizzle-level .default(sql`(datetime('now'))`)
-- on the column supplies a real timestamp for new rows via the generated INSERT.
ALTER TABLE `products` ADD `updated_at` text;--> statement-breakpoint
UPDATE `products` SET `updated_at` = COALESCE(`created_at`, datetime('now')) WHERE `updated_at` IS NULL;--> statement-breakpoint
CREATE INDEX `products_updated_idx` ON `products` (`updated_at`);
