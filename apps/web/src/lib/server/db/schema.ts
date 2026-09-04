import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
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
		price: integer('price').notNull().default(0), // store cents
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
	message: text('message').notNull(),
	createdAt: text('created_at').default(sql`(datetime('now'))`)
});
