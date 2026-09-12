import type { Context } from 'hono';
import { asc, eq, inArray } from 'drizzle-orm';
import { createDb } from '../../db';
import { featuredProducts, productImages, products } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { fail, ok, withMessage } from '../../http/response';
import type { SetFeatured } from '../../requests/featured';
import { imageUrl } from '../../services/products';

/** Admin: ordered home picks with product summaries (RBAC: products.write). */
export async function index(c: Context<Env>) {
	const db = createDb(c.env.DB);
	const picks = await db.select().from(featuredProducts).orderBy(asc(featuredProducts.sort)).all();
	if (!picks.length) return ok(c, []);
	const rows = await db
		.select()
		.from(products)
		.where(
			inArray(
				products.id,
				picks.map((p) => p.productId)
			)
		)
		.all();
	const byId = new Map(rows.map((r) => [r.id, r]));
	// keep pick order; drop ids whose product vanished mid-flight
	const ordered = picks.flatMap((p) => {
		const r = byId.get(p.productId);
		return r ? [r] : [];
	});
	// attach first image per pick (same N+1 as public list; picks are ≤4)
	const withImages = await Promise.all(
		ordered.map(async (p) => {
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
	return ok(c, withImages);
}

/** Admin: replace home picks (RBAC: products.write). Ids must exist and be active. */
export async function update(c: Context<Env>) {
	const { productIds } = c.req.valid('json' as never) as SetFeatured;
	const db = createDb(c.env.DB);
	const unique = [...new Set(productIds)];
	if (unique.length !== productIds.length) return fail(c, 400, 'duplicate product ids');
	if (unique.length) {
		const rows = await db.select({ id: products.id, status: products.status }).from(products).where(inArray(products.id, unique)).all();
		if (rows.length !== unique.length) return fail(c, 400, 'unknown product id');
		const draft = rows.find((r) => r.status !== 'active');
		if (draft) return fail(c, 400, 'only active products can be featured');
	}
	await db.delete(featuredProducts);
	for (let i = 0; i < unique.length; i++) {
		await db.insert(featuredProducts).values({ productId: unique[i], sort: i });
	}
	return withMessage(c, 'Featured products saved');
}
