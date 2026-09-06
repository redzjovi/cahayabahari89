import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, like, and, desc, sql } from 'drizzle-orm';
import { createDb } from './db';
import { products, categories, productImages, leads } from './db/schema';

type Bindings = {
	DB: D1Database;
	IMAGES: R2Bucket;
	IMAGES_URL?: string;
	ADMIN_TOKEN?: string;
	RESEND_API_KEY?: string;
};

/** Build the public URL for an R2 key. Empty base (unset IMAGES_URL) -> '' so UI falls back to placeholders. */
export function imageUrl(env: Bindings, r2Key: string): string {
	const base = (env.IMAGES_URL ?? '').replace(/\/+$/, '');
	return base ? `${base}/${r2Key}` : '';
}

const app = new Hono<{ Bindings: Bindings }>();

// Health
app.get('/api/health', (c) => c.json({ ok: true, time: new Date().toISOString() }));

// Categories
app.get('/api/categories', async (c) => {
	const db = createDb(c.env.DB);
	const rows = await db.select().from(categories).orderBy(categories.name);
	return c.json(rows);
});

// Products list with filter/pagination (showcase)
const sortSchema = z.enum(['best', 'name_asc', 'price_asc', 'price_desc']).default('best');

const productsQuerySchema = z.object({
	q: z.string().optional(),
	cat: z.string().optional(),
	minPrice: z.coerce.number().int().min(0).optional(),
	maxPrice: z.coerce.number().int().min(0).optional(),
	sort: sortSchema,
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(50).default(12)
});

app.get('/api/products', zValidator('query', productsQuerySchema), async (c) => {
	const { q, cat, minPrice, maxPrice, sort, page, limit } = c.req.valid('query');
	if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
		return c.json({ error: 'minPrice must not exceed maxPrice' }, 400);
	}
	const db = createDb(c.env.DB);
	const offset = (page - 1) * limit;

	const where = [];
	if (q) where.push(like(products.name, `%${q}%`));
	if (cat) {
		// resolve cat slug -> id
		const catRow = await db
			.select({ id: categories.id })
			.from(categories)
			.where(eq(categories.slug, cat))
			.get();
		if (catRow?.id) where.push(eq(products.categoryId, catRow.id));
		else return c.json({ products: [], total: 0, page, limit });
	}
	if (minPrice !== undefined) where.push(sql`${products.price} >= ${minPrice}`);
	if (maxPrice !== undefined) where.push(sql`${products.price} <= ${maxPrice}`);
	where.push(eq(products.status, 'active'));

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
			: sort === 'price_asc'
				? products.price
				: sort === 'price_desc'
					? desc(products.price)
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

	return c.json({ products: withImages, total, page, limit });
});

// Product detail
app.get('/api/products/:slug', async (c) => {
	const slug = c.req.param('slug');
	const db = createDb(c.env.DB);
	const product = await db.select().from(products).where(eq(products.slug, slug)).get();
	if (!product) return c.json({ error: 'not found' }, 404);
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
	return c.json({ ...product, images: imagesWithUrl, category });
});

// Contact lead
const contactSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email(),
	company: z.string().max(150).optional(),
	volume: z.string().max(60).optional(),
	message: z.string().min(10).max(2000)
});

app.post('/api/contact', zValidator('json', contactSchema), async (c) => {
	const { name, email, company, volume, message } = c.req.valid('json');
	const db = createDb(c.env.DB);
	await db.insert(leads).values({ name, email, company, volume, message });
	// TODO: Resend email via fetch if RESEND_API_KEY set
	return c.json({ ok: true }, 201);
});

// Admin create product (bearer simple check, replace with real auth later)
app.post(
	'/api/admin/products',
	zValidator(
		'json',
		z.object({
			slug: z.string().min(2),
			sku: z.string().optional(),
			name: z.string().min(2),
			description: z.string().optional(),
			price: z.number().int().min(0),
			categoryId: z.number().int().optional(),
			status: z.enum(['active', 'draft']).default('active')
		})
	),
	async (c) => {
		const auth = c.req.header('authorization');
		if (auth !== `Bearer ${c.env.ADMIN_TOKEN ?? 'dev-token'}`) {
			return c.json({ error: 'unauthorized' }, 401);
		}
		const data = c.req.valid('json');
		const db = createDb(c.env.DB);
		const res = await db.insert(products).values(data).returning();
		return c.json(res[0], 201);
	}
);

function requireAdmin(c: { req: { header: (n: string) => string | undefined }; env: Bindings }) {
	return c.req.header('authorization') === `Bearer ${c.env.ADMIN_TOKEN ?? 'dev-token'}`;
}

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function extFor(type: string): string {
	if (type === 'image/png') return 'png';
	if (type === 'image/webp') return 'webp';
	if (type === 'image/avif') return 'avif';
	return 'jpg';
}

// Admin: attach one or more images to a product (multipart: slug + files[])
app.post('/api/admin/images', async (c) => {
	if (!requireAdmin(c)) return c.json({ error: 'unauthorized' }, 401);
	const form = await c.req.formData().catch(() => null);
	if (!form) return c.json({ error: 'expected multipart form' }, 400);
	const slug = String(form.get('slug') ?? '');
	const files = form.getAll('files[]').concat(form.getAll('files'));
	if (!slug) return c.json({ error: 'slug is required' }, 400);
	if (!files.length) return c.json({ error: 'at least one file is required' }, 400);

	const db = createDb(c.env.DB);
	const product = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
	if (!product) return c.json({ error: 'product not found' }, 404);

	const existing = await db
		.select()
		.from(productImages)
		.where(eq(productImages.productId, product.id))
		.orderBy(desc(productImages.sort))
		.limit(1)
		.get();
	let sort = (existing?.sort ?? -1) + 1;

	const created = [];
	for (const f of files) {
		if (!(f instanceof File)) return c.json({ error: 'invalid file part' }, 400);
		if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
			return c.json({ error: `unsupported type ${f.type || 'unknown'} (jpeg/png/webp/avif only)` }, 400);
		}
		if (f.size > MAX_IMAGE_BYTES) return c.json({ error: `${f.name} exceeds 5 MB` }, 400);
		const key = `products/${slug}/${crypto.randomUUID()}.${extFor(f.type)}`;
		await c.env.IMAGES.put(key, f.stream(), {
			httpMetadata: { contentType: f.type },
			customMetadata: { slug }
		});
		const [row] = await db
			.insert(productImages)
			.values({ productId: product.id, r2Key: key, alt: f.name || slug, sort })
			.returning();
		created.push({ ...row, url: imageUrl(c.env, key) });
		sort++;
	}
	return c.json(created, 201);
});

// Admin: remove an image (R2 object + row)
app.delete('/api/admin/images/:id', async (c) => {
	if (!requireAdmin(c)) return c.json({ error: 'unauthorized' }, 401);
	const id = Number(c.req.param('id'));
	if (!Number.isInteger(id)) return c.json({ error: 'invalid id' }, 400);
	const db = createDb(c.env.DB);
	const row = await db.select().from(productImages).where(eq(productImages.id, id)).get();
	if (!row) return c.json({ error: 'not found' }, 404);
	await c.env.IMAGES.delete(row.r2Key);
	await db.delete(productImages).where(eq(productImages.id, id));
	return c.json({ ok: true });
});

export default app;
export type AppType = typeof app;
