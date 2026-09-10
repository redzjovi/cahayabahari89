import type { Context } from 'hono';
import {
	authenticate,
	bootstrapAdmin,
	createSession,
	pruneSessions,
	requireSessionUser,
	revokeSession
} from '../../auth';
import { createDb } from '../../db';
import type { Env } from '../../http/middleware';
import { fail, ok, withMessage } from '../../http/response';
import type { LoginInput } from '../../requests/auth';

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
