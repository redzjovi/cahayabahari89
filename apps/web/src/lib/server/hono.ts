import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, like, and, desc, sql } from 'drizzle-orm';
import { createDb } from './db';
import { products, categories, productImages, leads } from './db/schema';

type Bindings = {
	DB: D1Database;
	IMAGES: R2Bucket;
	ADMIN_TOKEN?: string;
	RESEND_API_KEY?: string;
};

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
const productsQuerySchema = z.object({
	q: z.string().optional(),
	cat: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(50).default(12)
});

app.get('/api/products', zValidator('query', productsQuerySchema), async (c) => {
	const { q, cat, page, limit } = c.req.valid('query');
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
	where.push(eq(products.status, 'active'));

	// count
	const countRes = await db
		.select({ count: sql<number>`count(*)` })
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.get();
	const total = countRes?.count ?? 0;

	const rows = await db
		.select()
		.from(products)
		.where(where.length ? and(...where) : undefined)
		.orderBy(desc(products.createdAt))
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
			return { ...p, image: img ?? null };
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
	return c.json({ ...product, images, category });
});

// Contact lead
const contactSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email(),
	message: z.string().min(10).max(2000)
});

app.post('/api/contact', zValidator('json', contactSchema), async (c) => {
	const { name, email, message } = c.req.valid('json');
	const db = createDb(c.env.DB);
	await db.insert(leads).values({ name, email, message });
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

export default app;
export type AppType = typeof app;
