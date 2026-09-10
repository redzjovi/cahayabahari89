import type { Context } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { createDb } from '../../db';
import { categories, products } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, withMessage } from '../../http/response';
import type { StoreCategory, UpdateCategory } from '../../requests/category';

/** Admin create category (RBAC: categories.write; list reuses public GET /api/categories). */
export async function store(c: Context<Env>) {
	const { slug, name } = c.req.valid('json' as never) as StoreCategory;
	const db = createDb(c.env.DB);
	if (await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).get()) {
		return fail(c, 409, 'category already exists');
	}
	const [row] = await db.insert(categories).values({ slug, name }).returning();
	return created(c, row, 'Category created');
}

export async function update(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const row = await db.select().from(categories).where(eq(categories.slug, slug)).get();
	if (!row) return fail(c, 404, 'not found');
	const [updated] = await db
		.update(categories)
		.set({ name: (c.req.valid('json' as never) as UpdateCategory).name })
		.where(eq(categories.id, row.id))
		.returning();
	return ok(c, updated, 'Category updated');
}

export async function destroy(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const row = await db.select().from(categories).where(eq(categories.slug, slug)).get();
	if (!row) return fail(c, 404, 'not found');
	const used = await db
		.select({ count: sql<number>`count(*)` })
		.from(products)
		.where(eq(products.categoryId, row.id))
		.get();
	if ((used?.count ?? 0) > 0) return fail(c, 409, 'category is used by products', { count: used?.count ?? 0 });
	await db.delete(categories).where(eq(categories.id, row.id));
	return withMessage(c, 'Category deleted');
}
