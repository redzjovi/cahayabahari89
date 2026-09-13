import type { Context } from 'hono';
import {
	authenticate,
	bootstrapAdmin,
	createSession,
	hashPassword,
	pruneSessions,
	requireSessionUser,
	revokeSession,
	verifyPassword
} from '../../auth';
import { createDb } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';
import type { Env } from '../../http/middleware';
import { fail, ok, withMessage } from '../../http/response';
import type { ChangePasswordInput, LoginInput, UpdateProfileInput } from '../../requests/auth';

export async function login(c: Context<Env>) {
	await bootstrapAdmin(c.env);
	const db = createDb(c.env.DB);
	await pruneSessions(db);
	const { email, password } = c.req.valid('json' as never) as LoginInput;
	const user = await authenticate(db, email, password);
	if (!user) return fail(c, 401, 'invalid credentials');
	const token = await createSession(db, user.id);
	const full = await requireSessionUser(c.env, `Bearer ${token}`);
	return ok(
		c,
		{
			token,
			user: full ? { ...full, permissions: [...full.permissions] } : { ...user, roles: [], permissions: [] }
		},
		'Logged in'
	);
}

export async function logout(c: Context<Env>) {
	const header = c.req.header('authorization');
	if (header?.startsWith('Bearer ')) await revokeSession(createDb(c.env.DB), header.slice(7));
	return withMessage(c, 'Logged out');
}

export async function me(c: Context<Env>) {
	const user = c.var.user;
	return ok(c, { ...user, permissions: [...user.permissions] });
}

export async function updateProfile(c: Context<Env>) {
	const { name } = c.req.valid('json' as never) as UpdateProfileInput;
	const db = createDb(c.env.DB);
	await db.update(users).set({ name }).where(eq(users.id, c.var.user.id));
	const full = await requireSessionUser(c.env, c.req.header('authorization') ?? '');
	return ok(c, full ? { ...full, permissions: [...full.permissions] } : { ...c.var.user, name, permissions: [...c.var.user.permissions] }, 'Profile updated');
}

export async function changePassword(c: Context<Env>) {
	const { currentPassword, newPassword } = c.req.valid('json' as never) as ChangePasswordInput;
	const db = createDb(c.env.DB);
	const row = await db
		.select({ passwordHash: users.passwordHash })
		.from(users)
		.where(eq(users.id, c.var.user.id))
		.get();
	if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
		return fail(c, 401, 'invalid current password');
	}
	await db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, c.var.user.id));
	return withMessage(c, 'Password changed');
}
