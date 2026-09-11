import { and, asc, eq } from 'drizzle-orm';
import { createDb } from './db';
import { menus, pageSections } from './db/schema';

export type MenuRow = typeof menus.$inferSelect;
export type SectionRow = typeof pageSections.$inferSelect;

export type MenuLocation = 'header' | 'social';

export type PublicMenu = {
	label: string;
	href: string;
	external: boolean;
};

export function isExternal(href: string): boolean {
	return /^https?:\/\//i.test(href);
}

/** Load visible menus for a location, with locale labels (ID fallback when EN empty). */
export async function loadMenus(d1: D1Database, location: MenuLocation, locale: 'en' | 'id'): Promise<PublicMenu[]> {
	try {
		const db = createDb(d1);
		const rows = await db
			.select()
			.from(menus)
			.where(and(eq(menus.location, location), eq(menus.visible, 1)))
			.orderBy(asc(menus.sort), asc(menus.id))
			.all();
		return rows.map((r) => ({
			label: locale === 'en' ? r.labelEn.trim() || r.labelId : r.labelId.trim() || r.labelEn,
			href: r.href,
			external: isExternal(r.href)
		}));
	} catch {
		return [];
	}
}

/** Load one page's sections merged with ID fallback (EN empty -> ID). */
export async function loadSections(
	d1: D1Database,
	page: string,
	locale: 'en' | 'id'
): Promise<Record<string, SectionRow & { missing: boolean }>> {
	try {
		const db = createDb(d1);
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
		const locMap = new Map(locRows.map((r) => [r.key, r]));
		const out: Record<string, SectionRow & { missing: boolean }> = {};
		for (const id of idRows) {
			const loc = locMap.get(id.key);
			const hasLoc = !!loc && (!!loc.body?.trim() || !!loc.heading?.trim() || !!loc.imageUrl?.trim());
			const src = locale === 'id' || !hasLoc ? id : loc!;
			out[id.key] = { ...src, missing: locale !== 'id' && !hasLoc };
		}
		for (const loc of locRows) {
			if (!out[loc.key]) out[loc.key] = { ...loc, missing: false };
		}
		return out;
	} catch {
		return {};
	}
}

/** Section body text with hardcoded fallback. */
export function secText(
	sections: Record<string, { body?: string | null }>,
	key: string,
	fallback: string
): string {
	const body = sections[key]?.body?.trim();
	return body ? body! : fallback;
}
