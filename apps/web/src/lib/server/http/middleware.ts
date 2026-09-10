import { createMiddleware } from 'hono/factory';
import { fail } from './response';
import { requireSessionUser, type Bindings, type SessionUser } from '../auth';

export type Env = { Bindings: Bindings; Variables: { user: SessionUser } };

/** Session auth: Bearer token -> context user (401 otherwise). */
export const auth = createMiddleware<Env>(async (c, next) => {
	const user = await requireSessionUser(c.env, c.req.header('authorization'));
	if (!user) return fail(c, 401, 'unauthorized');
	c.set('user', user);
	await next();
});

/** Permission guard: 403 unless the authed user holds the slug. */
export function need(perm: string) {
	return createMiddleware<Env>(async (c, next) => {
		if (!c.var.user.permissions.has(perm)) return fail(c, 403, 'forbidden');
		await next();
	});
}
