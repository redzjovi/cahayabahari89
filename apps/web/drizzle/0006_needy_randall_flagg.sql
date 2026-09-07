CREATE TABLE `product_slug_redirects` (
	`old_slug` text PRIMARY KEY NOT NULL,
	`product_id` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `product_slug_redirects_product_idx` ON `product_slug_redirects` (`product_id`);