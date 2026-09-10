import type { Context } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { slugify, productSlug } from '../../../slug';
import { createDb } from '../../db';
import { categories, productImages, productSlugRedirects, products } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, withMessage } from '../../http/response';
import type { StoreProduct, UpdateProduct } from '../../requests/product';

/** Admin create product (RBAC: products.write).
 * Slug is server-generated as slugify(name)-<id>: insert with a temp slug,
 * then finalize once the autoincrement id is known. Inherently unique. */
export async function store(c: Context<Env>) {
	const data = c.req.valid('json' as never) as StoreProduct;
	if (slugify(data.name) === '') return fail(c, 400, 'name must contain latin letters or digits');
	const db = createDb(c.env.DB);
	if (data.categoryId !== undefined && data.categoryId !== null) {
		const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId)).get();
		if (!cat) return fail(c, 400, 'unknown categoryId');
	}
	const [inserted] = await db
		.insert(products)
		.values({ ...data, slug: `tmp-${crypto.randomUUID()}` })
		.returning({ id: products.id });
	const [row] = await db
		.update(products)
		.set({ slug: productSlug(data.name, inserted.id) })
		.where(eq(products.id, inserted.id))
		.returning();
	return created(c, row, 'Product created');
}

/** Admin update product (RBAC: products.write).
 * A name change regenerates the slug (name-id); the old slug is kept in
 * product_slug_redirects so existing links 301 to the new URL. Slugs of
 * untouched names stay frozen. */
export async function update(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const patch = c.req.valid('json' as never) as UpdateProduct;
	const db = createDb(c.env.DB);
	const existing = await db.select().from(products).where(eq(products.slug, slug)).get();
	if (!existing) return fail(c, 404, 'not found');
	if (patch.name !== undefined && slugify(patch.name) === '') {
		return fail(c, 400, 'name must contain latin letters or digits');
	}
	if (patch.categoryId !== undefined && patch.categoryId !== null) {
		const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, patch.categoryId)).get();
		if (!cat) return fail(c, 400, 'unknown categoryId');
	}
	let nextSlug = slug;
	if (patch.name !== undefined && patch.name !== existing.name) {
		nextSlug = productSlug(patch.name, existing.id);
		if (nextSlug !== slug) {
			await db.insert(productSlugRedirects).values({ oldSlug: slug, productId: existing.id }).onConflictDoNothing();
		}
	}
	const [updated] = await db
		.update(products)
		.set({ ...patch, slug: nextSlug, updatedAt: sql`(datetime('now'))` })
		.where(eq(products.id, existing.id))
		.returning();
	return ok(c, updated, 'Product updated');
}

/** Admin delete product + its R2 objects + image rows (RBAC: products.write). */
export async function destroy(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
	if (!existing) return fail(c, 404, 'not found');
	const imgs = await db.select({ r2Key: productImages.r2Key }).from(productImages).where(eq(productImages.productId, existing.id)).all();
	await Promise.all(imgs.map((i) => c.env.IMAGES.delete(i.r2Key)));
	await db.delete(productImages).where(eq(productImages.productId, existing.id));
	await db.delete(products).where(eq(products.id, existing.id));
	return withMessage(c, 'Product deleted', 200, { imagesRemoved: imgs.length });
}
