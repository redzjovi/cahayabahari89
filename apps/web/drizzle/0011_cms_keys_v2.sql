-- CMS keys v2: merge/split keys per admin restructure. ID is source of truth.
-- Drop removed keys (both locales), insert merged rows (ID locale only; EN falls back).
DELETE FROM `page_sections` WHERE `key` IN (
	'hero.titleA', 'hero.titleB', 'hero.ctaProducts', 'hero.ctaContact',
	'featured.eyebrow', 'featured.title', 'featured.sub',
	'about.eyebrow', 'about.p1', 'about.p2',
	'milestone.0', 'milestone.1', 'milestone.2', 'milestone.3',
	'about.valuesTitle',
	'value.0.title', 'value.0.text', 'value.1.title', 'value.1.text', 'value.2.title', 'value.2.text',
	'contact.eyebrow', 'contact.title', 'contact.sub',
	'contact.name', 'contact.company', 'contact.email', 'contact.volume', 'contact.volumes',
	'contact.message', 'contact.send', 'contact.ok', 'contact.direct'
);--> statement-breakpoint
INSERT INTO `page_sections` (`page`, `locale`, `key`, `heading`, `body`, `sort`) VALUES
	('home', 'id', 'hero.title', NULL, 'Salmon segar dari laut, langsung ke meja Anda.', 2),
	('about', 'id', 'about.story', NULL, 'Cahaya Bahari 89 berawal dari satu keyakinan: salmon yang hebat harus terasa seperti laut asalnya. Kami bekerja langsung dengan nelayan dan farm bersertifikat, me-grading setiap batch saat fajar, dan memindahkannya dalam pendinginan konstan. Kini kami memasok resto, hotel, dan retail — serta mengemas porsi keluarga untuk juru masak rumahan yang menolak kompromi.', 3),
	('about', 'id', 'milestone', NULL, '2019, "Berdiri sebagai satu lapak pasar dengan satu chiller."
2021, "Kontrak B2B pertama dengan resto dan hotel."
2023, "Armada rantai dingin sendiri dan katalog online."
2025, "Lini grading kelas ekspor dan 50+ mitra."', 6),
	('about', 'id', 'about.value.title', NULL, 'Nilai-nilai kami', 7),
	('about', 'id', 'about.value.list', NULL, '"Kesegaran utama", "Yang tak layak untuk keluarga kami, tak kami jual."
"Grading jujur", "Isi kemasan sama dengan labelnya."
"Hormat pada laut", "Sumber bersertifikat dan pengolahan tanpa sisa."', 8);
