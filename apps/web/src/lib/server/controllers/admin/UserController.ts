import type { Context } from 'hono';
import { and, desc, eq, like, sql } from 'drizzle-orm';
import { createDb } from '../../db';
import { userRoles, users } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, paginated } from '../../http/response';
import type { StoreUser, UpdateUser } from '../../requests/user';
import { hashPassword, revokeUserSessions } from '../../auth';
import { resolveRoleIds, rolesOf } from '../../services/rbac';

export async function index(c: Context<Env>) {
	const { sort, page, limit, email, name, status } = c.req.valid('query' as never) as {
		sort: 'created_desc' | 'created_asc' | 'email_asc' | 'email_desc' | 'name_asc' | 'name_desc' | 'status_asc' | 'status_desc';
		page: number;
		limit: number;
		email?: string;
		name?: string;
		status?: 'active' | 'suspended';
	};
	const db = createDb(c.env.DB);
	const where = [];
	if (email) where.push(like(users.email, `%${email}%`));
	if (name) where.push(like(users.name, `%${name}%`));
	if (status) where.push(eq(users.status, status));
	const total = (await db.select({ count: sql<number>`count(*)` }).from(users).where(where.length ? and(...where) : undefined).get())?.count ?? 0;
	const orderBy =
		sort === 'created_asc'
			? users.createdAt
			: sort === 'created_desc'
				? desc(users.createdAt)
				: sort === 'email_asc'
					? users.email
					: sort === 'email_desc'
						? desc(users.email)
						: sort === 'name_asc'
							? users.name
							: sort === 'name_desc'
								? desc(users.name)
								: sort === 'status_asc'
									? users.status
									: desc(users.status);
	const rows = await db
		.select({ id: users.id, email: users.email, name: users.name, status: users.status, createdAt: users.createdAt })
		.from(users)
		.where(where.length ? and(...where) : undefined)
		.orderBy(orderBy)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	const items = await Promise.all(rows.map(async (u) => ({ ...u, roles: await rolesOf(db, u.id) })));
	return paginated(c, items, page, limit, total);
}

export async function store(c: Context<Env>) {
	const { email, name, password, roles: roleSlugs } = c.req.valid('json' as never) as StoreUser;
	const db = createDb(c.env.DB);
	if (await db.select({ id: users.id }).from(users).where(eq(users.email, email)).get()) {
		return fail(c, 409, 'email already exists');
	}
	const roleRows = await resolveRoleIds(db, roleSlugs);
	if ('missing' in roleRows) return fail(c, 400, `unknown roles: ${roleRows.missing.join(', ')}`);
	const [user] = await db
		.insert(users)
		.values({ email, name, passwordHash: await hashPassword(password) })
		.returning({ id: users.id, email: users.email, name: users.name, status: users.status });
	for (const r of roleRows) await db.insert(userRoles).values({ userId: user.id, roleId: r.id });
	return created(c, { ...user, roles: roleSlugs }, 'User created');
}

export async function update(c: Context<Env>) {
	const id = Number((c.req.param('id') as string));
	if (!Number.isInteger(id)) return fail(c, 400, 'invalid id');
	const patch = c.req.valid('json' as never) as UpdateUser;
	const db = createDb(c.env.DB);
	const existing = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).get();
	if (!existing) return fail(c, 404, 'not found');
	if (patch.status === 'suspended' && id === c.var.user.id) {
		return fail(c, 400, 'cannot suspend your own account');
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
		if ('missing' in roleRows) return fail(c, 400, `unknown roles: ${roleRows.missing.join(', ')}`);
		await db.delete(userRoles).where(eq(userRoles.userId, id));
		for (const r of roleRows) await db.insert(userRoles).values({ userId: id, roleId: r.id });
	}
	const updated = await db
		.select({ id: users.id, email: users.email, name: users.name, status: users.status })
		.from(users)
		.where(eq(users.id, id))
		.get();
	return ok(c, { ...updated, roles: await rolesOf(db, id) }, 'User updated');
}
