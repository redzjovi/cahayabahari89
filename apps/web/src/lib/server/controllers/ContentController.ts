import type { Context } from 'hono';
import { and, eq, sql } from 'drizzle-orm';
import { createDb } from '../db';
import { pageSections } from '../db/schema';
import type { Env } from '../http/middleware';
import { fail, ok } from '../http/response';
import type { UpsertPage } from '../requests/content';

const PAGES = ['home', 'about', 'contact', 'site'] as const;

export type SectionRow = typeof pageSections.$inferSelect;

/** Merge ID + requested locale: requested wins when non-empty, else ID fallback. */
export function mergeWithFallback(idRows: SectionRow[], locRows: SectionRow[], locale: string) {
	const locMap = new Map(locRows.map((r) => [r.key, r]));
	const out = idRows.map((id) => {
		const loc = locMap.get(id.key);
		const body = loc?.body?.trim() ? loc!.body : id.body;
		const heading = loc?.heading?.trim() ? loc!.heading : id.heading;
		const imageUrl = loc?.imageUrl?.trim() ? loc!.imageUrl : id.imageUrl;
		const fromFallback = locale !== 'id' && (!loc || (!loc.body?.trim() && !loc.heading?.trim() && !loc.imageUrl?.trim()));
		return { ...id, heading, body, imageUrl, locale, missing: fromFallback };
	});
	// locale-only keys (no ID row) — pass through
	for (const loc of locRows) {
		if (!out.some((r) => r.key === loc.key)) out.push({ ...loc, locale, missing: false });
	}
	return out.sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
}

/** Public page content. `GET /api/pages/:page?locale=id|en` (default id). */
export async function show(c: Context<Env>) {
	const page = c.req.param('page') as string;
	if (!(PAGES as readonly string[]).includes(page)) return fail(c, 404, 'unknown page');
	const locale = c.req.query('locale') === 'en' ? 'en' : 'id';
	const db = createDb(c.env.DB);
	const idRows = await db
		.select()
		.from(pageSections)
		.where(and(eq(pageSections.page, page), eq(pageSections.locale, 'id')))
		.all();
	const locRows =
		locale === 'id'
			? idRows
			: await db
					.select()
					.from(pageSections)
					.where(and(eq(pageSections.page, page), eq(pageSections.locale, 'en')))
					.all();
	return ok(c, { page, locale, sections: mergeWithFallback(idRows, locRows, locale) });
}

/** Admin bulk upsert for one locale: `PUT /api/admin/pages/:page {locale, sections[]}`. */
export async function upsert(c: Context<Env>) {
	const page = c.req.param('page') as string;
	if (!(PAGES as readonly string[]).includes(page)) return fail(c, 404, 'unknown page');
	const { locale, sections } = c.req.valid('json' as never) as UpsertPage;
	const db = createDb(c.env.DB);
	for (const [i, s] of sections.entries()) {
		const existing = await db
			.select()
			.from(pageSections)
			.where(
				and(eq(pageSections.page, page), eq(pageSections.locale, locale), eq(pageSections.key, s.key))
			)
			.get();
		if (existing) {
			await db
				.update(pageSections)
				.set({
					heading: s.heading ?? null,
					body: s.body ?? null,
					imageUrl: s.imageUrl ?? null,
					sort: s.sort ?? i,
					updatedAt: sql`(datetime('now'))`
				})
				.where(eq(pageSections.id, existing.id));
		} else {
			await db.insert(pageSections).values({
				page,
				locale,
				key: s.key,
				heading: s.heading ?? null,
				body: s.body ?? null,
				imageUrl: s.imageUrl ?? null,
				sort: s.sort ?? i
			});
		}
	}
	const rows = await db
		.select()
		.from(pageSections)
		.where(and(eq(pageSections.page, page), eq(pageSections.locale, locale)))
		.all();
	return ok(c, { page, locale, sections: rows }, 'Content saved');
}
