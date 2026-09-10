import type { Context } from 'hono';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { createDb } from '../../db';
import { leads } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { fail, ok, paginated } from '../../http/response';

/** Admin list contact inquiries (RBAC: leads.read). */
export async function index(c: Context<Env>) {
	const { sort, page, limit, name, email } = c.req.valid('query' as never) as {
		sort: 'created_asc' | 'created_desc' | 'name_asc' | 'name_desc' | 'email_asc' | 'email_desc';
		page: number;
		limit: number;
		name?: string;
		email?: string;
	};
	const db = createDb(c.env.DB);
	const where = [];
	if (name) where.push(like(leads.name, `%${name}%`));
	if (email) where.push(like(leads.email, `%${email}%`));
	const clause = where.length ? and(...where) : undefined;
	const total = (await db.select({ count: sql<number>`count(*)` }).from(leads).where(clause).get())?.count ?? 0;
	const orderBy =
		sort === 'created_asc'
			? leads.createdAt
			: sort === 'created_desc'
				? desc(leads.createdAt)
				: sort === 'name_asc'
					? leads.name
					: sort === 'name_desc'
						? desc(leads.name)
						: sort === 'email_asc'
							? leads.email
							: desc(leads.email);
	const items = await db
		.select({ id: leads.id, name: leads.name, email: leads.email, company: leads.company, volume: leads.volume, message: leads.message, createdAt: leads.createdAt })
		.from(leads)
		.where(clause)
		.orderBy(orderBy)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	return paginated(c, items, page, limit, total);
}

/** Admin lead detail (RBAC: leads.read). */
export async function show(c: Context<Env>) {
	const id = Number((c.req.param('id') as string));
	if (!Number.isInteger(id)) return fail(c, 400, 'invalid id');
	const db = createDb(c.env.DB);
	const row = await db.select().from(leads).where(eq(leads.id, id)).get();
	if (!row) return fail(c, 404, 'not found');
	return ok(c, row);
}
