import type { Context } from 'hono';
import { createDb } from '../db';
import { leads } from '../db/schema';
import type { Env } from '../http/middleware';
import { created } from '../http/response';
import type { ContactInput } from '../requests/lead';

/** Public contact-lead intake. */
export async function store(c: Context<Env>) {
	const { name, email, company, volume, message } = c.req.valid('json' as never) as ContactInput;
	const db = createDb(c.env.DB);
	await db.insert(leads).values({ name, email, company, volume, message });
	// TODO: Resend email via fetch if RESEND_API_KEY set
	return created(c, { ok: true }, 'Message received');
}
