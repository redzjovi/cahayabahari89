import { Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq, like, and, desc, sql } from 'drizzle-orm';
import { createDb } from './db';
import { products, categories, productImages, leads, users, roles, permissions, userRoles, rolePermissions } from './db/schema';
import { hashPassword } from './auth';
import {
	authenticate,
	bootstrapAdmin,
	createSession,
	pruneSessions,
	requireSessionUser,
	revokeSession,
	revokeUserSessions,
	type Bindings,
	type SessionUser
} from './auth';

const slugRule = z
	.string()
	.min(2)
	.max(60)
	.regex(/^[a-z0-9._-]+$/, 'lowercase letters, numbers, dot, underscore, dash only');

/** Build the public URL for an R2 key. Empty base (unset IMAGES_URL) -> '' so UI falls back to placeholders. */
export function imageUrl(env: Bindings, r2Key: string): string {
	const base = (env.IMAGES_URL ?? '').replace(/\/+$/, '');
	return base ? `${base}/${r2Key}` : '';
}

type Env = { Bindings: Bindings; Variables: { user: SessionUser } };

const app = new Hono<Env>();

/** Session auth: Bearer token -> context user (401 otherwise). */
const auth = createMiddleware<Env>(async (c, next) => {
	const user = await requireSessionUser(c.env, c.req.header('authorization'));
	if (!user) return c.json({ error: 'unauthorized' }, 401);
	c.set('user', user);
	await next();
});

/** Permission guard: 403 unless the authed user holds the slug. */
function need(perm: string) {
	return createMiddleware<Env>(async (c, next) => {
		if (!c.var.user.permissions.has(perm)) return c.json({ error: 'forbidden' }, 403);
		await next();
	});
}

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

// Admin create product (RBAC: products.write)
app.post(
	'/api/admin/products',
	auth,
	need('products.write'),
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
		const data = c.req.valid('json');
		const db = createDb(c.env.DB);
		if (data.categoryId !== undefined && data.categoryId !== null) {
			const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, data.categoryId)).get();
			if (!cat) return c.json({ error: 'unknown categoryId' }, 400);
		}
		const res = await db.insert(products).values(data).returning();
		return c.json(res[0], 201);
	}
);

// Admin: update product (RBAC: products.write)
app.patch(
	'/api/admin/products/:slug',
	auth,
	need('products.write'),
	zValidator(
		'json',
		z.object({
			sku: z.string().optional(),
			name: z.string().min(2).max(150).optional(),
			description: z.string().max(5000).optional(),
			price: z.number().int().min(0).optional(),
			categoryId: z.number().int().nullable().optional(),
			status: z.enum(['active', 'draft']).optional()
		})
	),
	async (c) => {
		const slug = c.req.param('slug');
		const patch = c.req.valid('json');
		const db = createDb(c.env.DB);
		const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
		if (!existing) return c.json({ error: 'not found' }, 404);
		if (patch.categoryId !== undefined && patch.categoryId !== null) {
			const cat = await db.select({ id: categories.id }).from(categories).where(eq(categories.id, patch.categoryId)).get();
			if (!cat) return c.json({ error: 'unknown categoryId' }, 400);
		}
		const [updated] = await db.update(products).set(patch).where(eq(products.id, existing.id)).returning();
		return c.json(updated);
	}
);

// Admin: delete product + its R2 objects + image rows (RBAC: products.write)
app.delete('/api/admin/products/:slug', auth, need('products.write'), async (c) => {
	const slug = c.req.param('slug');
	const db = createDb(c.env.DB);
	const existing = await db.select({ id: products.id }).from(products).where(eq(products.slug, slug)).get();
	if (!existing) return c.json({ error: 'not found' }, 404);
	const imgs = await db.select({ r2Key: productImages.r2Key }).from(productImages).where(eq(productImages.productId, existing.id)).all();
	await Promise.all(imgs.map((i) => c.env.IMAGES.delete(i.r2Key)));
	await db.delete(productImages).where(eq(productImages.productId, existing.id));
	await db.delete(products).where(eq(products.id, existing.id));
	return c.json({ ok: true, imagesRemoved: imgs.length });
});

// Admin: categories (RBAC: categories.write; list reuses public GET /api/categories)
app.post(
	'/api/admin/categories',
	auth,
	need('categories.write'),
	zValidator('json', z.object({ slug: slugRule, name: z.string().min(2).max(100) })),
	async (c) => {
		const { slug, name } = c.req.valid('json');
		const db = createDb(c.env.DB);
		if (await db.select({ id: categories.id }).from(categories).where(eq(categories.slug, slug)).get()) {
			return c.json({ error: 'category already exists' }, 409);
		}
		const [row] = await db.insert(categories).values({ slug, name }).returning();
		return c.json(row, 201);
	}
);

app.patch(
	'/api/admin/categories/:slug',
	auth,
	need('categories.write'),
	zValidator('json', z.object({ name: z.string().min(2).max(100) })),
	async (c) => {
		const slug = c.req.param('slug');
		const db = createDb(c.env.DB);
		const row = await db.select().from(categories).where(eq(categories.slug, slug)).get();
		if (!row) return c.json({ error: 'not found' }, 404);
		const [updated] = await db.update(categories).set({ name: c.req.valid('json').name }).where(eq(categories.id, row.id)).returning();
		return c.json(updated);
	}
);

app.delete('/api/admin/categories/:slug', auth, need('categories.write'), async (c) => {
	const slug = c.req.param('slug');
	const db = createDb(c.env.DB);
	const row = await db.select().from(categories).where(eq(categories.slug, slug)).get();
	if (!row) return c.json({ error: 'not found' }, 404);
	const used = await db
		.select({ count: sql<number>`count(*)` })
		.from(products)
		.where(eq(products.categoryId, row.id))
		.get();
	if ((used?.count ?? 0) > 0) return c.json({ error: 'category is used by products', count: used?.count ?? 0 }, 409);
	await db.delete(categories).where(eq(categories.id, row.id));
	return c.json({ ok: true });
});

// Admin: list contact inquiries (RBAC: leads.read)
app.get('/api/admin/leads', auth, need('leads.read'), async (c) => {
	const db = createDb(c.env.DB);
	const rows = await db.select().from(leads).orderBy(desc(leads.createdAt)).limit(100).all();
	return c.json(rows);
});

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function extFor(type: string): string {
	if (type === 'image/png') return 'png';
	if (type === 'image/webp') return 'webp';
	if (type === 'image/avif') return 'avif';
	return 'jpg';
}

// Admin: attach one or more images to a product (multipart: slug + files[], RBAC: images.write)
app.post('/api/admin/images', auth, need('images.write'), async (c) => {
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

// Admin: remove an image (R2 object + row, RBAC: images.write)
app.delete('/api/admin/images/:id', auth, need('images.write'), async (c) => {
	const id = Number(c.req.param('id'));
	if (!Number.isInteger(id)) return c.json({ error: 'invalid id' }, 400);
	const db = createDb(c.env.DB);
	const row = await db.select().from(productImages).where(eq(productImages.id, id)).get();
	if (!row) return c.json({ error: 'not found' }, 404);
	await c.env.IMAGES.delete(row.r2Key);
	await db.delete(productImages).where(eq(productImages.id, id));
	return c.json({ ok: true });
});

// ── Admin: users / roles / permissions management ──

async function rolesOf(db: ReturnType<typeof createDb>, userId: number): Promise<string[]> {
	const rows = await db
		.select({ slug: roles.slug })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, userId))
		.all();
	return rows.map((r) => r.slug);
}

async function resolveRoleIds(db: ReturnType<typeof createDb>, slugs: string[]) {
	if (!slugs.length) return [];
	const rows = await db
		.select({ id: roles.id, slug: roles.slug })
		.from(roles)
		.where(sql`${roles.slug} IN (${sql.join(slugs, sql`, `)})`)
		.all();
	const found = new Set(rows.map((r) => r.slug));
	const missing = slugs.filter((s) => !found.has(s));
	if (missing.length) return { missing } as const;
	return rows;
}

async function resolvePermissionIds(db: ReturnType<typeof createDb>, slugs: string[]) {
	if (!slugs.length) return [];
	const rows = await db
		.select({ id: permissions.id, slug: permissions.slug })
		.from(permissions)
		.where(sql`${permissions.slug} IN (${sql.join(slugs, sql`, `)})`)
		.all();
	const found = new Set(rows.map((r) => r.slug));
	const missing = slugs.filter((s) => !found.has(s));
	if (missing.length) return { missing } as const;
	return rows;
}

// Users
app.get('/api/admin/users', auth, need('users.manage'), async (c) => {
	const db = createDb(c.env.DB);
	const all = await db
		.select({ id: users.id, email: users.email, name: users.name, status: users.status, createdAt: users.createdAt })
		.from(users)
		.orderBy(users.email)
		.all();
	return c.json(await Promise.all(all.map(async (u) => ({ ...u, roles: await rolesOf(db, u.id) }))));
});

app.post(
	'/api/admin/users',
	auth,
	need('users.manage'),
	zValidator(
		'json',
		z.object({
			email: z.string().email(),
			name: z.string().min(2).max(100),
			password: z.string().min(8).max(200),
			roles: z.array(z.string()).default([])
		})
	),
	async (c) => {
		const { email, name, password, roles: roleSlugs } = c.req.valid('json');
		const db = createDb(c.env.DB);
		if (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) {
			return c.json({ error: 'email already exists' }, 409);
		}
		const roleRows = await resolveRoleIds(db, roleSlugs);
		if ('missing' in roleRows) return c.json({ error: `unknown roles: ${roleRows.missing.join(', ')}` }, 400);
		const [user] = await db
			.insert(users)
			.values({ email, name, passwordHash: await hashPassword(password) })
			.returning({ id: users.id, email: users.email, name: users.name, status: users.status });
		for (const r of roleRows) await db.insert(userRoles).values({ userId: user.id, roleId: r.id });
		return c.json({ ...user, roles: roleSlugs }, 201);
	}
);

app.patch(
	'/api/admin/users/:id',
	auth,
	need('users.manage'),
	zValidator(
		'json',
		z.object({
			name: z.string().min(2).max(100).optional(),
			status: z.enum(['active', 'suspended']).optional(),
			password: z.string().min(8).max(200).optional(),
			roles: z.array(z.string()).optional()
		})
	),
	async (c) => {
		const id = Number(c.req.param('id'));
		if (!Number.isInteger(id)) return c.json({ error: 'invalid id' }, 400);
		const patch = c.req.valid('json');
		const db = createDb(c.env.DB);
		const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).get();
		if (!existing) return c.json({ error: 'not found' }, 404);
		if (patch.status === 'suspended' && id === c.var.user.id) {
			return c.json({ error: 'cannot suspend your own account' }, 400);
		}
		if (patch.name !== undefined || patch.status !== undefined || patch.password !== undefined) {
			await db
				.update(users)
				.set({
					...(patch.name !== undefined ? { name: patch.name } : {}),
					...(patch.status !== undefined ? { status: patch.status } : {}),
					...(patch.password !== undefined ? { passwordHash: await hashPassword(patch.password) } : {})
				})
				.where(eq(users.id, id));
			if (patch.status === 'suspended') await revokeUserSessions(db, id);
		}
		if (patch.roles !== undefined) {
			const roleRows = await resolveRoleIds(db, patch.roles);
			if ('missing' in roleRows) return c.json({ error: `unknown roles: ${roleRows.missing.join(', ')}` }, 400);
			await db.delete(userRoles).where(eq(userRoles.userId, id));
			for (const r of roleRows) await db.insert(userRoles).values({ userId: id, roleId: r.id });
		}
		const updated = await db
			.select({ id: users.id, email: users.email, name: users.name, status: users.status })
			.from(users)
			.where(eq(users.id, id))
			.get();
		return c.json({ ...updated, roles: await rolesOf(db, id) });
	}
);

// Roles
app.get('/api/admin/roles', auth, need('roles.manage'), async (c) => {
	const db = createDb(c.env.DB);
	const all = await db.select().from(roles).orderBy(roles.slug).all();
	return c.json(
		await Promise.all(
			all.map(async (r) => {
				const perms = await db
					.select({ slug: permissions.slug })
					.from(rolePermissions)
					.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
					.where(eq(rolePermissions.roleId, r.id))
					.all();
				const usersCount = await db
					.select({ count: sql<number>`count(*)` })
					.from(userRoles)
					.where(eq(userRoles.roleId, r.id))
					.get();
				return { ...r, permissions: perms.map((p) => p.slug), users: usersCount?.count ?? 0 };
			})
		)
	);
});

app.post(
	'/api/admin/roles',
	auth,
	need('roles.manage'),
	zValidator('json', z.object({ slug: slugRule, name: z.string().min(2).max(100), permissions: z.array(z.string()).default([]) })),
	async (c) => {
		const { slug, name, permissions: permSlugs } = c.req.valid('json');
		const db = createDb(c.env.DB);
		if (await db.select({ id: roles.id }).from(roles).where(eq(roles.slug, slug)).get()) {
			return c.json({ error: 'role already exists' }, 409);
		}
		const permRows = await resolvePermissionIds(db, permSlugs);
		if ('missing' in permRows) return c.json({ error: `unknown permissions: ${permRows.missing.join(', ')}` }, 400);
		const [role] = await db.insert(roles).values({ slug, name }).returning();
		for (const p of permRows) await db.insert(rolePermissions).values({ roleId: role.id, permissionId: p.id });
		return c.json({ ...role, permissions: permSlugs }, 201);
	}
);

app.patch(
	'/api/admin/roles/:slug',
	auth,
	need('roles.manage'),
	zValidator('json', z.object({ name: z.string().min(2).max(100).optional(), permissions: z.array(z.string()).optional() })),
	async (c) => {
		const slug = c.req.param('slug');
		const patch = c.req.valid('json');
		const db = createDb(c.env.DB);
		const role = await db.select().from(roles).where(eq(roles.slug, slug)).get();
		if (!role) return c.json({ error: 'not found' }, 404);
		if (patch.name !== undefined) await db.update(roles).set({ name: patch.name }).where(eq(roles.id, role.id));
		if (patch.permissions !== undefined) {
			const permRows = await resolvePermissionIds(db, patch.permissions);
			if ('missing' in permRows) return c.json({ error: `unknown permissions: ${permRows.missing.join(', ')}` }, 400);
			await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
			for (const p of permRows) await db.insert(rolePermissions).values({ roleId: role.id, permissionId: p.id });
		}
		const perms = await db
			.select({ slug: permissions.slug })
			.from(rolePermissions)
			.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
			.where(eq(rolePermissions.roleId, role.id))
			.all();
		const updated = await db.select().from(roles).where(eq(roles.id, role.id)).get();
		return c.json({ ...updated, permissions: perms.map((p) => p.slug) });
	}
);

app.delete('/api/admin/roles/:slug', auth, need('roles.manage'), async (c) => {
	const slug = c.req.param('slug');
	const db = createDb(c.env.DB);
	const role = await db.select().from(roles).where(eq(roles.slug, slug)).get();
	if (!role) return c.json({ error: 'not found' }, 404);
	const assigned = await db
		.select({ count: sql<number>`count(*)` })
		.from(userRoles)
		.where(eq(userRoles.roleId, role.id))
		.get();
	if ((assigned?.count ?? 0) > 0) return c.json({ error: 'role is assigned to users' }, 409);
	await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
	await db.delete(roles).where(eq(roles.id, role.id));
	return c.json({ ok: true });
});

// Permissions (full CRUD; slugs immutable once created — code enforces them)
app.get('/api/admin/permissions', auth, need('roles.manage'), async (c) => {
	const db = createDb(c.env.DB);
	return c.json(await db.select().from(permissions).orderBy(permissions.slug).all());
});

app.post(
	'/api/admin/permissions',
	auth,
	need('roles.manage'),
	zValidator('json', z.object({ slug: slugRule, name: z.string().min(2).max(100) })),
	async (c) => {
		const { slug, name } = c.req.valid('json');
		const db = createDb(c.env.DB);
		if (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.slug, slug)).get()) {
			return c.json({ error: 'permission already exists' }, 409);
		}
		const [row] = await db.insert(permissions).values({ slug, name }).returning();
		return c.json(row, 201);
	}
);

app.patch(
	'/api/admin/permissions/:slug',
	auth,
	need('roles.manage'),
	zValidator('json', z.object({ name: z.string().min(2).max(100) })),
	async (c) => {
		const slug = c.req.param('slug');
		const db = createDb(c.env.DB);
		const row = await db.select().from(permissions).where(eq(permissions.slug, slug)).get();
		if (!row) return c.json({ error: 'not found' }, 404);
		const [updated] = await db.update(permissions).set({ name: c.req.valid('json').name }).where(eq(permissions.id, row.id)).returning();
		return c.json(updated);
	}
);

app.delete('/api/admin/permissions/:slug', auth, need('roles.manage'), async (c) => {
	const slug = c.req.param('slug');
	const db = createDb(c.env.DB);
	const row = await db.select().from(permissions).where(eq(permissions.slug, slug)).get();
	if (!row) return c.json({ error: 'not found' }, 404);
	const assigned = await db
		.select({ count: sql<number>`count(*)` })
		.from(rolePermissions)
		.where(eq(rolePermissions.permissionId, row.id))
		.get();
	if ((assigned?.count ?? 0) > 0) return c.json({ error: 'permission is assigned to roles' }, 409);
	await db.delete(permissions).where(eq(permissions.id, row.id));
	return c.json({ ok: true });
});

// ── Auth: sessions (RBAC) ──

app.post(
	'/api/auth/login',
	zValidator('json', z.object({ email: z.string().email(), password: z.string().min(1) })),
	async (c) => {
		await bootstrapAdmin(c.env);
		const db = createDb(c.env.DB);
		await pruneSessions(db);
		const { email, password } = c.req.valid('json');
		const user = await authenticate(db, email, password);
		if (!user) return c.json({ error: 'invalid credentials' }, 401);
		const token = await createSession(db, user.id);
		const full = await requireSessionUser(c.env, `Bearer ${token}`);
		return c.json({
			token,
			user: full ? { ...full, permissions: [...full.permissions] } : { ...user, roles: [], permissions: [] }
		});
	}
);

app.post('/api/auth/logout', async (c) => {
	const header = c.req.header('authorization');
	if (header?.startsWith('Bearer ')) await revokeSession(createDb(c.env.DB), header.slice(7));
	return c.json({ ok: true });
});

app.get('/api/auth/me', auth, async (c) => {
	const user = c.var.user;
	return c.json({ ...user, permissions: [...user.permissions] });
});

export default app;
export type AppType = typeof app;
