-- Backfill name-id slugs for pre-existing products; keep old slugs as redirects.
UPDATE `products` SET `slug`='fillet-salmon-premium-1' WHERE `id`=1;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('fillet-salmon-premium', 1);--> statement-breakpoint
UPDATE `products` SET `slug`='salmon-utuh-2' WHERE `id`=2;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('salmon-utuh', 2);--> statement-breakpoint
UPDATE `products` SET `slug`='steak-salmon-3' WHERE `id`=3;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('steak-salmon', 3);--> statement-breakpoint
UPDATE `products` SET `slug`='perut-salmon-4' WHERE `id`=4;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('perut-salmon', 4);--> statement-breakpoint
UPDATE `products` SET `slug`='salmon-cube-dadu-5' WHERE `id`=5;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('dadu-salmon', 5);--> statement-breakpoint
UPDATE `products` SET `slug`='kepala-salmon-6' WHERE `id`=6;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('kepala-salmon', 6);--> statement-breakpoint
UPDATE `products` SET `slug`='smoked-salmon-250g-7' WHERE `id`=7;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('smoked-salmon', 7);--> statement-breakpoint
UPDATE `products` SET `slug`='fillet-tuna-segar-8' WHERE `id`=8;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('fillet-tuna', 8);--> statement-breakpoint
UPDATE `products` SET `slug`='kakap-merah-utuh-9' WHERE `id`=9;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('kakap-merah', 9);--> statement-breakpoint
UPDATE `products` SET `slug`='salmon-portion-200g-10' WHERE `id`=10;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('salmon-portion', 10);--> statement-breakpoint
UPDATE `products` SET `slug`='kulit-salmon-11' WHERE `id`=11;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('kulit-salmon', 11);--> statement-breakpoint
UPDATE `products` SET `slug`='buntut-salmon-12' WHERE `id`=12;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('buntut-salmon', 12);--> statement-breakpoint
UPDATE `products` SET `slug`='tuna-steak-cut-13' WHERE `id`=13;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('tuna-steak', 13);--> statement-breakpoint
UPDATE `products` SET `slug`='fillet-kakap-14' WHERE `id`=14;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('fillet-kakap', 14);--> statement-breakpoint
UPDATE `products` SET `slug`='udang-vaname-segar-15' WHERE `id`=15;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('udang-vaname', 15);--> statement-breakpoint
UPDATE `products` SET `slug`='cumi-segar-16' WHERE `id`=16;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('cumi-segar', 16);--> statement-breakpoint
UPDATE `products` SET `slug`='gurame-hidup-17' WHERE `id`=17;--> statement-breakpoint
INSERT INTO `product_slug_redirects` (`old_slug`, `product_id`) VALUES ('gurame', 17);--> statement-breakpoint
