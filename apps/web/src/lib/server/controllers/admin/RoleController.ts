import type { Context } from 'hono';
import { desc, eq, sql } from 'drizzle-orm';
import { createDb } from '../../db';
import { permissions, rolePermissions, roles, userRoles } from '../../db/schema';
import type { Env } from '../../http/middleware';
import { created, fail, ok, paginated, withMessage } from '../../http/response';
import type { StoreRole, UpdateRole } from '../../requests/role';
import { resolvePermissionIds } from '../../services/rbac';

export async function index(c: Context<Env>) {
	const { page, limit } = c.req.valid('query' as never) as { page: number; limit: number };
	const db = createDb(c.env.DB);
	const total = (await db.select({ count: sql<number>`count(*)` }).from(roles).get())?.count ?? 0;
	const rows = await db
		.select()
		.from(roles)
		.orderBy(roles.slug)
		.limit(limit)
		.offset((page - 1) * limit)
		.all();
	const items = await Promise.all(
		rows.map(async (r) => {
			const perms = await db
				.select({ slug: permissions.slug })
				.from(rolePermissions)
				.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
				.where(eq(rolePermissions.roleId, r.id))
				.orderBy(permissions.slug)
				.all();
			const usersCount = await db
				.select({ count: sql<number>`count(*)` })
				.from(userRoles)
				.where(eq(userRoles.roleId, r.id))
				.get();
			return { ...r, permissions: perms.map((p) => p.slug), users: usersCount?.count ?? 0 };
		})
	);
	return paginated(c, items, page, limit, total);
}

export async function store(c: Context<Env>) {
	const { slug, name, permissions: permSlugs } = c.req.valid('json' as never) as StoreRole;
	const db = createDb(c.env.DB);
	if (await db.select({ id: roles.id }).from(roles).where(eq(roles.slug, slug)).get()) {
		return fail(c, 409, 'role already exists');
	}
	const permRows = await resolvePermissionIds(db, permSlugs);
	if ('missing' in permRows) return fail(c, 400, `unknown permissions: ${permRows.missing.join(', ')}`);
	const [role] = await db.insert(roles).values({ slug, name }).returning();
	for (const p of permRows) await db.insert(rolePermissions).values({ roleId: role.id, permissionId: p.id });
	return created(c, { ...role, permissions: permSlugs }, 'Role created');
}

export async function update(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const patch = c.req.valid('json' as never) as UpdateRole;
	const db = createDb(c.env.DB);
	const role = await db.select().from(roles).where(eq(roles.slug, slug)).get();
	if (!role) return fail(c, 404, 'not found');
	if (patch.name !== undefined) await db.update(roles).set({ name: patch.name }).where(eq(roles.id, role.id));
	if (patch.permissions !== undefined) {
		const permRows = await resolvePermissionIds(db, patch.permissions);
		if ('missing' in permRows) return fail(c, 400, `unknown permissions: ${permRows.missing.join(', ')}`);
		await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
		for (const p of permRows) await db.insert(rolePermissions).values({ roleId: role.id, permissionId: p.id });
	}
	const perms = await db
		.select({ slug: permissions.slug })
		.from(rolePermissions)
		.innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
		.where(eq(rolePermissions.roleId, role.id))
		.orderBy(permissions.slug)
		.all();
	const updated = await db.select().from(roles).where(eq(roles.id, role.id)).get();
	return ok(c, { ...updated, permissions: perms.map((p) => p.slug) }, 'Role updated');
}

export async function destroy(c: Context<Env>) {
	const slug = (c.req.param('slug') as string);
	const db = createDb(c.env.DB);
	const role = await db.select().from(roles).where(eq(roles.slug, slug)).get();
	if (!role) return fail(c, 404, 'not found');
	const assigned = await db
		.select({ count: sql<number>`count(*)` })
		.from(userRoles)
		.where(eq(userRoles.roleId, role.id))
		.get();
	if ((assigned?.count ?? 0) > 0) return fail(c, 409, 'role is assigned to users');
	await db.delete(rolePermissions).where(eq(rolePermissions.roleId, role.id));
	await db.delete(roles).where(eq(roles.id, role.id));
	return withMessage(c, 'Role deleted');
}
