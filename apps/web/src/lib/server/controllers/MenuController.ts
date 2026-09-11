import type { Context } from 'hono';
import { asc, eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { createDb } from '../db';
import { menus } from '../db/schema';
import type { Env } from '../http/middleware';
import { created, fail, ok, paginated, withMessage } from '../http/response';
import type { StoreMenu, UpdateMenu } from '../requests/menu';

const LOCATIONS = ['header', 'social'] as const;

/** Public menu list. `?location=header|social` (default all), visible-only, sort ASC. */
export async function list(c: Context<Env>) {
	const location = c.req.query('location');
	const db = createDb(c.env.DB);
	const where = location
		? (LOCATIONS as readonly string[]).includes(location)
			? sql`${menus.location} = ${location} AND ${menus.visible} = 1`
			: null
		: sql`${menus.visible} = 1`;
	if (where === null) return fail(c, 400, 'unknown location');
	const rows = await db
		.select()
		.from(menus)
		.where(where)
		.orderBy(asc(menus.sort), asc(menus.id))
		.all();
	return ok(c, rows);
}

/** Admin menu list (all rows incl. hidden, paginated). */
export async function adminIndex(c: Context<Env>) {
	const q = c.req.valid('query' as never) as { page: number; limit: number };
	const db = createDb(c.env.DB);
	const total = (await db.select({ count: sql<number>`count(*)` }).from(menus).get())?.count ?? 0;
	const rows = await db
		.select()
		.from(menus)
		.orderBy(asc(menus.location), asc(menus.sort), asc(menus.id))
		.limit(q.limit)
		.offset((q.page - 1) * q.limit)
		.all();
	return paginated(c, rows, q.page, q.limit, total);
}

/** Admin: persist the exact order shown in the admin list — orderedIds[0] is first.
 * Scoped to one location; must list every menu of that location exactly once. */
export async function reorder(c: Context<Env>) {
	const body = await c.req.json().catch(() => null);
	const parsed = z.object({ location: z.enum(['header', 'social']), orderedIds: z.array(z.number().int().positive()).min(1).max(100) }).safeParse(body);
	if (!parsed.success) return fail(c, 400, 'location and orderedIds[] are required');
	const { location, orderedIds } = parsed.data;
	if (new Set(orderedIds).size !== orderedIds.length) return fail(c, 400, 'duplicate menu ids');
	const db = createDb(c.env.DB);
	const rows = await db.select({ id: menus.id }).from(menus).where(eq(menus.location, location)).all();
	if (rows.length !== orderedIds.length) return fail(c, 400, 'orderedIds must list every menu of this location exactly once');
	const known = new Set(rows.map((r) => r.id));
	if (!orderedIds.every((id) => known.has(id))) return fail(c, 400, 'unknown menu id for this location');
	for (let i = 0; i < orderedIds.length; i++) {
		await db.update(menus).set({ sort: i, updatedAt: sql`(datetime('now'))` }).where(eq(menus.id, orderedIds[i]));
	}
	return withMessage(c, 'Order saved');
}

/** Admin single menu row (RBAC: content.manage). */
export async function show(c: Context<Env>) {
	const id = Number(c.req.param('id'));
	if (!Number.isInteger(id)) return fail(c, 404, 'not found');
	const db = createDb(c.env.DB);
	const row = await db.select().from(menus).where(eq(menus.id, id)).get();
	if (!row) return fail(c, 404, 'not found');
	return ok(c, row);
}

export async function store(c: Context<Env>) {
	const input = c.req.valid('json' as never) as StoreMenu;
	const db = createDb(c.env.DB);
	const [row] = await db
		.insert(menus)
		.values({
			location: input.location,
			labelEn: input.labelEn ?? '',
			labelId: input.labelId ?? '',
			href: input.href,
			sort: input.sort ?? 0,
			visible: input.visible === false ? 0 : 1
		})
		.returning();
	return created(c, row, 'Menu created');
}

export async function update(c: Context<Env>) {
	const id = Number(c.req.param('id'));
	if (!Number.isInteger(id)) return fail(c, 404, 'not found');
	const patch = c.req.valid('json' as never) as UpdateMenu;
	const db = createDb(c.env.DB);
	const row = await db.select().from(menus).where(eq(menus.id, id)).get();
	if (!row) return fail(c, 404, 'not found');
	const [updated] = await db
		.update(menus)
		.set({
			...(patch.location !== undefined ? { location: patch.location } : {}),
			...(patch.labelEn !== undefined ? { labelEn: patch.labelEn } : {}),
			...(patch.labelId !== undefined ? { labelId: patch.labelId } : {}),
			...(patch.href !== undefined ? { href: patch.href } : {}),
			...(patch.sort !== undefined ? { sort: patch.sort } : {}),
			...(patch.visible !== undefined ? { visible: patch.visible ? 1 : 0 } : {}),
			updatedAt: sql`(datetime('now'))`
		})
		.where(eq(menus.id, id))
		.returning();
	return ok(c, updated, 'Menu updated');
}

export async function destroy(c: Context<Env>) {
	const id = Number(c.req.param('id'));
	if (!Number.isInteger(id)) return fail(c, 404, 'not found');
	const db = createDb(c.env.DB);
	const row = await db.select().from(menus).where(eq(menus.id, id)).get();
	if (!row) return fail(c, 404, 'not found');
	await db.delete(menus).where(eq(menus.id, id));
	return withMessage(c, 'Menu deleted');
}
