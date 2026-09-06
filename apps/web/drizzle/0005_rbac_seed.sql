-- Standard RBAC seed: roles, permissions, mappings. Explicit ids for determinism.
INSERT INTO `roles` (`id`, `slug`, `name`) VALUES
	(1, 'admin', 'Administrator'),
	(2, 'staff', 'Staff'),
	(3, 'viewer', 'Viewer');--> statement-breakpoint
INSERT INTO `permissions` (`id`, `slug`, `name`) VALUES
	(1, 'products.read', 'View products'),
	(2, 'products.write', 'Create/update products'),
	(3, 'categories.read', 'View categories'),
	(4, 'categories.write', 'Create/update categories'),
	(5, 'images.write', 'Upload/delete product images'),
	(6, 'leads.read', 'View contact inquiries'),
	(7, 'users.manage', 'Manage users'),
	(8, 'roles.manage', 'Manage roles and permissions');--> statement-breakpoint
INSERT INTO `role_permissions` (`role_id`, `permission_id`) VALUES
	(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8),
	(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6),
	(3, 1), (3, 3);
