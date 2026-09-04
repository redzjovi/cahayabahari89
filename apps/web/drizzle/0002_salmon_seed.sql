-- Sample salmon catalog seed (prices in IDR rupiah). Safe to edit/replace with real data.
INSERT INTO `categories` (`id`, `slug`, `name`) VALUES
	(1, 'salmon-segar', 'Salmon Segar'),
	(2, 'salmon-olahan', 'Salmon Olahan'),
	(3, 'ikan-segar', 'Ikan Segar Lainnya');--> statement-breakpoint
INSERT INTO `products` (`slug`, `sku`, `name`, `description`, `price`, `category_id`, `status`) VALUES
	('fillet-salmon-premium', 'SLM-FL-01', 'Fillet Salmon Premium', 'Fillet salmon tanpa tulang dan kulit, sashimi-grade. Dipotong fresh setiap pagi, cocok untuk sushi, grill, dan oven.', 285000, 1, 'active'),
	('salmon-utuh', 'SLM-WH-01', 'Salmon Utuh (Whole)', 'Salmon utuh segar 4–6 kg per ekor, insang merah cerah dan mata jernih. Ideal untuk resto dan acara.', 195000, 1, 'active'),
	('steak-salmon', 'SLM-ST-01', 'Steak Salmon', 'Potongan steak salmon tebal ±3 cm, juicy untuk grill dan pan-sear. Kemasan vakum higienis.', 245000, 1, 'active'),
	('perut-salmon', 'SLM-BL-01', 'Perut Salmon (Belly)', 'Bagian belly salmon yang gurih dan lembut — favorit untuk bakar dan sup. Harga per kg.', 145000, 1, 'active'),
	('dadu-salmon', 'SLM-CB-01', 'Salmon Cube / Dadu', 'Potongan dadu salmon segar, praktis untuk poke bowl, sup, dan meal-prep. Harga per kg.', 265000, 1, 'active'),
	('kepala-salmon', 'SLM-HD-01', 'Kepala Salmon', 'Kepala salmon segar untuk sup, gulai, dan kaldu yang kaya rasa. Harga per kg.', 85000, 1, 'active'),
	('smoked-salmon', 'SLM-SM-01', 'Smoked Salmon 250g', 'Smoked salmon iris tipis, diasap dengan kayu pilihan. Kemasan vakum 250 gram, siap santap.', 195000, 2, 'active'),
	('fillet-tuna', 'TNA-FL-01', 'Fillet Tuna Segar', 'Fillet tuna loin segar, daging merah padat. Cocok untuk sashimi, steak, dan grill. Harga per kg.', 175000, 3, 'active'),
	('kakap-merah', 'KKP-WH-01', 'Kakap Merah Utuh', 'Kakap merah utuh segar dari perairan Indonesia. Daging putih manis, cocok untuk bakar dan steam. Harga per kg.', 120000, 3, 'active');
