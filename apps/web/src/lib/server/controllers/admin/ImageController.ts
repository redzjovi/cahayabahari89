import type { Context } from 'hono';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { createDb } from '../../db';
import { productImages, products } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, withMessage } from '../../http/response';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, extFor } from '../../requests/image';
import { imageUrl } from '../../services/products';

/** Admin: attach one or more images to a product (multipart: slug + files[], RBAC: images.write). */
export async function store(c: Context<Env>) {
	const form = await c.req.formData().catch(() => null);
	if (!form) return fail(c, 400, 'expected multipart form');
	const slug = String(form.get('slug') ?? '');
	const files = form.getAll('files[]').concat(form.getAll('files'));
	if (!slug) return fail(c, 400, 'slug is required');
	if (!files.length) return fail(c, 400, 'at least one file is required');

	const db = createDb(c.env.DB);
	const product = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
	if (!product) return fail(c, 404, 'product not found');

	const existing = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, product.id))
		.orderBy(desc(productImages.sort))
		.limit(1)
		.get();
	let sort = (existing?.sort ?? -1) + 1;

	const uploaded = [];
	const createdKeys: string[] = [];
	// Validate every file BEFORE storing anything — a mid-batch failure must
	// not leave orphan R2 objects (or rows) behind.
	for (const f of files) {
		if (!(f instanceof File)) return fail(c, 400, 'invalid file part');
		if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
			return fail(c, 400, `unsupported type ${f.type || 'unknown'} (jpeg/png/webp/avif only)`);
		}
		if (f.size > MAX_IMAGE_BYTES) return fail(c, 400, `${f.name} exceeds 5 MB`);
	}
	try {
		for (const f of files as File[]) {
			const key = `products/${slug}/${crypto.randomUUID()}.${extFor(f.type)}`;
			// Pass the File (Blob) itself, not f.stream(): miniflare's local R2
			// requires a known-length body, which a detached stream doesn't have.
			// Workerd's R2 accepts Blob values identically, so prod is unaffected.
			await c.env.IMAGES.put(key, f, {
				httpMetadata: { contentType: f.type },
				customMetadata: { slug }
			});
			createdKeys.push(key);
			const [row] = await db
				.insert(productImages)
				.values({ productId: product.id, r2Key: key, alt: f.name || slug, sort })
				.returning();
			uploaded.push({ ...row, url: imageUrl(c.env, key) });
			sort++;
		}
	} catch (e) {
		// Roll back anything this batch stored: R2 objects first, then rows.
		console.error('[images] batch upload failed:', e);
		await Promise.all(createdKeys.map((k) => c.env.IMAGES.delete(k).catch(() => {})));
		if (createdKeys.length) {
			await db.delete(productImages).where(inArray(productImages.r2Key, createdKeys)).catch(() => {});
		}
		return fail(c, 500, 'upload failed, partial files cleaned up');
	}
	return created(c, uploaded, 'Images uploaded');
}

/** Admin: reorder images for a product (RBAC: images.write).
 * Persists the exact order shown in the admin grid — images[0] is the cover. */
export async function reorder(c: Context<Env>) {
	const body = await c.req.json().catch(() => null);
	const parsed = z
		.object({ slug: z.string().min(1), orderedIds: z.array(z.number().int().positive()).min(1).max(100) })
		.safeParse(body);
	if (!parsed.success) return fail(c, 400, 'slug and orderedIds[] are required');
	const { slug, orderedIds } = parsed.data;
	if (new Set(orderedIds).size !== orderedIds.length) return fail(c, 400, 'duplicate image ids');

	const db = createDb(c.env.DB);
	const product = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
	if (!product) return fail(c, 404, 'product not found');

	const rows = await db
		.select({ id: productImages.id })
		.from(productImages)
		.where(eq(productImages.productId, product.id))
		.all();
	if (rows.length !== orderedIds.length) return fail(c, 400, 'orderedIds must list every image exactly once');
	const known = new Set(rows.map((r) => r.id));
	if (!orderedIds.every((id) => known.has(id))) return fail(c, 400, 'unknown image id for this product');

	for (let i = 0; i < orderedIds.length; i++) {
		await db
			.update(productImages)
			.set({ sort: i })
			.where(and(eq(productImages.id, orderedIds[i]), eq(productImages.productId, product.id)));
	}
	return withMessage(c, 'Order saved');
}

/** Admin: remove an image (R2 object + row, RBAC: images.write). */
export async function destroy(c: Context<Env>) {
	const id = Number((c.req.param('id') as string));
	if (!Number.isInteger(id)) return fail(c, 400, 'invalid id');
	const db = createDb(c.env.DB);
	const row = await db.select().from(productImages).where(eq(productImages.id, id)).get();
	if (!row) return fail(c, 404, 'not found');
	await c.env.IMAGES.delete(row.r2Key);
	await db.delete(productImages).where(eq(productImages.id, id));
	return withMessage(c, 'Image deleted');
}
