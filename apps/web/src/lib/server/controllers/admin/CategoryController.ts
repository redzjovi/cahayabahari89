import type { Context } from 'hono';
import { desc, eq, like, sql } from 'drizzle-orm';
import { slugify } from '../../../slug';
import { createDb } from '../../db';
import { categories, products } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, paginated, withMessage } from '../../http/response';
import type { CategoriesFilter, StoreCategory, UpdateCategory } from '../../requests/category';

/** Admin category list (RBAC: categories.write): name search, status filter,
 * sorts incl. product count. Public list stays active-only without counts. */
export async function index(c: Context<Env>) {
	const { page, limit } = c.req.valid('query' as never) as { page: number; limit: number };
	const { q, status, sort } = c.req.valid('query' as never) as CategoriesFilter & {
		sort: 'name_asc' | 'name_desc' | 'slug_asc' | 'slug_desc' | 'status_asc' | 'status_desc' | 'products_asc' | 'products_desc';
	};
	const db = createDb(c.env.DB);
	const where = [];
	if (q?.trim()) where.push(like(categories.name, `%${q.trim()}%`));
	if (status !== 'all') where.push(eq(categories.status, status));
	const count = sql<number>`count(${products.id})`;
	const total = (await db.select({ count: sql<number>`count(*)` }).from(categories).where(where.length ? sql.join(where, sql` AND `) : undefined).get())?.count ?? 0;
	const orderBy =
		sort === 'name_desc'
			? desc(categories.name)
			: sort === 'slug_asc'
				? categories.slug
				: sort === 'slug_desc'
					? desc(categories.slug)
					: sort === 'status_asc'
						? categories.status
						: sort === 'status_desc'
							? desc(categories.status)
							: sort === 'products_asc'
								? count
								: sort === 'products_desc'
									? desc(count)
									: categories.name;
	const rows = await db
		.select({ id: categories.id, slug: categories.slug, name: categories.name, status: categories.status, createdAt: categories.createdAt, products: count })
		.from(categories)
		.leftJoin(products, eq(products.categoryId, categories.id))
		.where(where.length ? sql.join(where, sql` AND `) : undefined)
		.groupBy(categories.id)
		.orderBy(orderBy)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	return paginated(c, rows, page, limit, total);
}

/** Admin create category (RBAC: categories.write; list reuses public GET /api/categories).
 * Slug is server-generated as slugify(name)-<id>: insert with a temp slug,
 * then finalize once the autoincrement id is known. Inherently unique. */
export async function store(c: Context<Env>) {
	const { name, status } = c.req.valid('json' as never) as StoreCategory;
	if (slugify(name) === '') return fail(c, 400, 'name must contain latin letters or digits');
	const db = createDb(c.env.DB);
	const [inserted] = await db
		.insert(categories)
		.values({ slug: `tmp-${crypto.randomUUID()}`, name, status })
		.returning({ id: categories.id });
	const [row] = await db
		.update(categories)
		.set({ slug: `${slugify(name)}-${inserted.id}` })
		.where(eq(categories.id, inserted.id))
		.returning();
	return created(c, row, 'Category created');
}

/** Admin rename category (RBAC: categories.write). A rename regenerates the
 * slug (name-id, product-style); stale ?cat= links yield an empty list. */
export async function update(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const row = await db.select().from(categories).where(eq(categories.slug, slug)).get();
	if (!row) return fail(c, 404, 'not found');
	const { name, status } = c.req.valid('json' as never) as UpdateCategory;
	const nextName = name ?? row.name;
	if (slugify(nextName) === '') return fail(c, 400, 'name must contain latin letters or digits');
	const nextSlug = nextName !== row.name ? `${slugify(nextName)}-${row.id}` : slug;
	const [updated] = await db
		.update(categories)
		.set({ name: nextName, slug: nextSlug, ...(status !== undefined ? { status } : {}) })
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
