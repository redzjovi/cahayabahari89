import type { Context } from 'hono';
import type { Env } from '../http/middleware';
import { ok } from '../http/response';

export async function show(c: Context<Env>) {
	return ok(c, { ok: true, time: new Date().toISOString() });
}
