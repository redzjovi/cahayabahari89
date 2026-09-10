import { eq, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { permissions, roles, userRoles } from '../db/schema';

export async function rolesOf(db: ReturnType<typeof createDb>, userId: number): Promise<string[]> {
	const rows = await db
		.select({ slug: roles.slug })
		.from(userRoles)
		.innerJoin(roles, eq(userRoles.roleId, roles.id))
		.where(eq(userRoles.userId, userId))
		.all();
	return rows.map((r) => r.slug);
}

export async function resolveRoleIds(db: ReturnType<typeof createDb>, slugs: string[]) {
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

export async function resolvePermissionIds(db: ReturnType<typeof createDb>, slugs: string[]) {
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
