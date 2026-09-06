import { sqliteTable, text, integer, index, primaryKey } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const categories = sqliteTable(
	'categories',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull().unique(),
		name: text('name').notNull(),
		// Self-referencing FK enforced at app level (avoids TS circular-inference error).
		parentId: integer('parent_id'),
		createdAt: text('created_at').default(sql`(datetime('now'))`)
	},
	(table) => [index('categories_slug_idx').on(table.slug)]
);

export const products = sqliteTable(
	'products',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		slug: text('slug').notNull().unique(),
		sku: text('sku').unique(),
		name: text('name').notNull(),
		description: text('description'),
		price: integer('price').notNull().default(0), // store IDR rupiah directly
		categoryId: integer('category_id').references(() => categories.id),
		status: text('status').notNull().default('active'), // active | draft
		createdAt: text('created_at').default(sql`(datetime('now'))`)
	},
	(table) => [
		index('products_slug_idx').on(table.slug),
		index('products_category_idx').on(table.categoryId),
		index('products_status_idx').on(table.status)
	]
);

export const productImages = sqliteTable(
	'product_images',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productId: integer('product_id')
			.notNull()
			.references(() => products.id, { onDelete: 'cascade' }),
		r2Key: text('r2_key').notNull(),
		alt: text('alt'),
		sort: integer('sort').notNull().default(0)
	},
	(table) => [index('product_images_product_idx').on(table.productId)]
);

export const leads = sqliteTable('leads', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	name: text('name').notNull(),
	email: text('email').notNull(),
	company: text('company'),
	volume: text('volume'),
	message: text('message').notNull(),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});

// ── RBAC ──

export const users = sqliteTable(
	'users',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		email: text('email').notNull().unique(),
		name: text('name').notNull(),
		passwordHash: text('password_hash').notNull(), // "saltHex$hashHex" (PBKDF2-SHA256)
		status: text('status').notNull().default('active'), // active | suspended
		createdAt: text('created_at').default(sql`(datetime('now'))`)
	},
	(table) => [index('users_email_idx').on(table.email)]
);

export const roles = sqliteTable('roles', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull()
});

export const permissions = sqliteTable('permissions', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	slug: text('slug').notNull().unique(),
	name: text('name').notNull()
});

export const userRoles = sqliteTable(
	'user_roles',
	{
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		roleId: integer('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.userId, table.roleId] })]
);

export const rolePermissions = sqliteTable(
	'role_permissions',
	{
		roleId: integer('role_id')
			.notNull()
			.references(() => roles.id, { onDelete: 'cascade' }),
		permissionId: integer('permission_id')
			.notNull()
			.references(() => permissions.id, { onDelete: 'cascade' })
	},
	(table) => [primaryKey({ columns: [table.roleId, table.permissionId] })]
);

export const sessions = sqliteTable(
	'sessions',
	{
		tokenHash: text('token_hash').primaryKey(), // SHA-256 hex of the opaque token
		userId: integer('user_id')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull() // datetime('now')-comparable string
	},
	(table) => [index('sessions_user_idx').on(table.userId)]
);
