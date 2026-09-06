-- Extra sample products so the catalog spans 2 pages (17 items at limit 12).
INSERT INTO `products` (`slug`, `sku`, `name`, `description`, `price`, `category_id`, `status`) VALUES
	('salmon-portion', 'SLM-PT-01', 'Salmon Portion 200g', 'Potongan salmon 200 gram siap masak, kemasan vakum per porsi. Praktis untuk meal-prep.', 95000, 1, 'active'),
	('kulit-salmon', 'SLM-SK-01', 'Kulit Salmon', 'Kulit salmon segar, cocok digoreng crispy atau untuk kerupuk kulit. Harga per kg.', 75000, 1, 'active'),
	('buntut-salmon', 'SLM-TL-01', 'Buntut Salmon (Tail)', 'Bagian ekor salmon, daging padat dan gurih untuk sup dan bakar. Harga per kg.', 65000, 1, 'active'),
	('tuna-steak', 'TNA-ST-01', 'Tuna Steak Cut', 'Potongan steak tuna loin, tebal dan padat. Ideal untuk grill medium-rare. Harga per kg.', 185000, 3, 'active'),
	('fillet-kakap', 'KKP-FL-01', 'Fillet Kakap', 'Fillet kakap putih bersih tanpa duri, favorit untuk steam, sup, dan anak-anak. Harga per kg.', 145000, 3, 'active'),
	('udang-vaname', 'UDG-VN-01', 'Udang Vaname Segar', 'Udang vaname segar size 40-60, manis dan kenyal untuk goreng, bakar, dan tumis. Harga per kg.', 110000, 3, 'active'),
	('cumi-segar', 'CMI-SG-01', 'Cumi Segar', 'Cumi segar tinta utuh, tekstur kenyal untuk bakar dan tumis. Harga per kg.', 95000, 3, 'active'),
	('gurame', 'GRM-GR-01', 'Gurame Hidup', 'Gurame segar 500-800 gram per ekor, favorit untuk bakar dan goreng. Harga per kg.', 75000, 3, 'active');
