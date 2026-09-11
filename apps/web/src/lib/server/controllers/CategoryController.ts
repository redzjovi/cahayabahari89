import type { Context } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { categories } from '../db/schema';
import type { Env } from '../http/middleware';
import { paginated } from '../http/response';

/** Public category list (active only; admin uses GET /api/admin/categories). */
export async function list(c: Context<Env>) {
	const { sort, page, limit } = c.req.valid('query' as never) as {
		sort: 'name_asc' | 'name_desc' | 'slug_asc' | 'slug_desc' | 'status_asc' | 'status_desc' | 'products_asc' | 'products_desc';
		page: number;
		limit: number;
	};
	const db = createDb(c.env.DB);
	const orderBy =
		sort === 'name_desc'
			? desc(categories.name)
			: sort === 'slug_asc'
				? categories.slug
				: sort === 'slug_desc'
					? desc(categories.slug)
					: categories.name;
	const activeOnly = eq(categories.status, 'active');
	const total = (await db.select({ count: sql<number>`count(*)` }).from(categories).where(activeOnly).get())?.count ?? 0;
	const items = await db
		.select()
		.from(categories)
		.where(activeOnly)
		.orderBy(orderBy)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	return paginated(c, items, page, limit, total);
}
