import type { Context } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { createDb } from '../../db';
import { permissions, rolePermissions } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, paginated, withMessage } from '../../http/response';
import type { StorePermission, UpdatePermission } from '../../requests/permission';

/** Permissions (full CRUD; slugs immutable once created — code enforces them). */
export async function index(c: Context<Env>) {
	const { sort, page, limit } = c.req.valid('query' as never) as {
		sort: 'slug_asc' | 'slug_desc' | 'name_asc' | 'name_desc';
		page: number;
		limit: number;
	};
	const db = createDb(c.env.DB);
	const orderBy =
		sort === 'slug_asc'
			? permissions.slug
			: sort === 'slug_desc'
				? desc(permissions.slug)
				: sort === 'name_asc'
					? permissions.name
					: desc(permissions.name);
	const total = (await db.select({ count: sql<number>`count(*)` }).from(permissions).get())?.count ?? 0;
	const items = await db
		.select()
		.from(permissions)
		.orderBy(orderBy)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	return paginated(c, items, page, limit, total);
}

export async function store(c: Context<Env>) {
	const { slug, name } = c.req.valid('json' as never) as StorePermission;
	const db = createDb(c.env.DB);
	if (await db.select({ id: permissions.id }).from(permissions).where(eq(permissions.slug, slug)).get()) {
		return fail(c, 409, 'permission already exists');
	}
	const [row] = await db.insert(permissions).values({ slug, name }).returning();
	return created(c, row, 'Permission created');
}

export async function update(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const row = await db.select().from(permissions).where(eq(permissions.slug, slug)).get();
	if (!row) return fail(c, 404, 'not found');
	const [updated] = await db
		.update(permissions)
		.set({ name: (c.req.valid('json' as never) as UpdatePermission).name })
		.where(eq(permissions.id, row.id))
		.returning();
	return ok(c, updated, 'Permission updated');
}

export async function destroy(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const row = await db.select().from(permissions).where(eq(permissions.slug, slug)).get();
	if (!row) return fail(c, 404, 'not found');
	const assigned = await db
		.select({ count: sql<number>`count(*)` })
		.from(rolePermissions)
		.where(eq(rolePermissions.permissionId, row.id))
		.get();
	if ((assigned?.count ?? 0) > 0) return fail(c, 409, 'permission is assigned to roles');
	await db.delete(permissions).where(eq(permissions.id, row.id));
	return withMessage(c, 'Permission deleted');
}
