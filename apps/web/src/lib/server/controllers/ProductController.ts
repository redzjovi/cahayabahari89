import type { Context } from 'hono';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { categories, productImages, productSlugRedirects, products } from '../db/schema';
import type { Env } from '../http/middleware';
import { fail, ok, paginated } from '../http/response';
import type { ProductsQuery } from '../requests/product';
import { imageUrl } from '../services/products';

/** Public product list with filter/pagination (showcase). */
export async function list(c: Context<Env>) {
	const { q, cat, minPrice, maxPrice, sort, status, page, limit } = c.req.valid('query' as never) as ProductsQuery;
	if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
		return fail(c, 400, 'minPrice must not exceed maxPrice');
	}
	const db = createDb(c.env.DB);
	const offset = (page - 1) * limit;

	const where = [];
	// Draft categories hide their products from the public list.
	where.push(sql`${products.categoryId} IS NULL OR ${products.categoryId} NOT IN (SELECT ${categories.id} FROM ${categories} WHERE ${categories.status} = 'draft')`);
	if (q) where.push(like(products.name, `%${q}%`));
	if (cat) {
		// resolve cat slug -> id (draft categories resolve to empty)
		const catRow = await db
			.select({ id: categories.id, status: categories.status })
			.from(categories)
			.where(eq(categories.slug, cat))
			.get();
		if (!catRow?.id || catRow.status !== 'active') return paginated(c, [], page, limit, 0);
		where.push(eq(products.categoryId, catRow.id));
	}
	if (minPrice !== undefined) where.push(sql`${products.price} >= ${minPrice}`);
	if (maxPrice !== undefined) where.push(sql`${products.price} <= ${maxPrice}`);
	if (status !== 'all') where.push(eq(products.status, status));

	// count
	const countRes = await db
		.select({ count: sql<number>`count(*)` })
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.get();
	const total = countRes?.count ?? 0;

	// Prototype ordering: 'best' == newest-first server-side; the curated
	// pinning happens in the SvelteKit layer (see CURATED in katalog/+page.svelte).
	const orderBy =
		sort === 'name_asc'
			? products.name
			: sort === 'name_desc'
				? desc(products.name)
				: sort === 'price_asc'
					? products.price
					: sort === 'price_desc'
						? desc(products.price)
						: sort === 'status_asc'
							? products.status
							: sort === 'status_desc'
								? desc(products.status)
								: sort === 'updated_asc'
									? products.updatedAt
									: sort === 'updated_desc'
										? desc(products.updatedAt)
										: desc(products.createdAt);

	const rows = await db
		.select()
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.orderBy(orderBy)
		.limit(limit)
		.offset(offset)
		.all();

	// attach first image per product (simple N+1 for showcase; optimize later with join)
	const withImages = await Promise.all(
		rows.map(async (p) => {
			const img = await db
				.select()
				.from(productImages)
				.where(eq(productImages.productId, p.id))
				.orderBy(productImages.sort)
				.limit(1)
				.get();
			return { ...p, image: img ? { ...img, url: imageUrl(c.env, img.r2Key) } : null };
		})
	);

	return paginated(c, withImages, page, limit, total);
}

/** Product detail. Unknown slugs fall back to the rename-history table and
 * 301 to the current slug URL (fetch follows; SvelteKit load converts to a
 * page-level 301 — see products/[slug]/+page.server.ts). */
export async function show(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const product = await db.select().from(products).where(eq(products.slug, slug)).get();
	if (!product) {
		const hit = await db.select().from(productSlugRedirects).where(eq(productSlugRedirects.oldSlug, slug)).get();
		if (hit) {
			const current = await db.select({ slug: products.slug }).from(products).where(eq(products.id, hit.productId)).get();
			if (current) return c.redirect(`/api/products/${current.slug}`, 301);
		}
		return fail(c, 404, 'not found');
	}
	// Draft categories hide their products (list + detail).
	if (product.categoryId) {
		const cat = await db
			.select({ status: categories.status })
			.from(categories)
			.where(eq(categories.id, product.categoryId))
			.get();
		if (!cat || cat.status !== 'active') return fail(c, 404, 'not found');
	}
	const images = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, product.id))
		.orderBy(productImages.sort)
		.all();
	const category = product.categoryId
		? await db.select().from(categories).where(eq(categories.id, product.categoryId)).get()
		: null;
	const imagesWithUrl = images.map((img) => ({ ...img, url: imageUrl(c.env, img.r2Key) }));
	return ok(c, { ...product, images: imagesWithUrl, category });
}
