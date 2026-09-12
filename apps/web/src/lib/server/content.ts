import { and, asc, desc, eq, inArray, notInArray } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { createDb } from './db';
import { categories, featuredProducts, menus, pageSections, productImages, products } from './db/schema';
import type { Bindings } from './auth';
import { imageUrl } from './services/products';

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

/** Curated home products: admin picks in order, backfilled with latest active
 * to `limit` (draft + draft-category products excluded, like the public list). */
export async function loadFeatured(d1: D1Database, env: Bindings, limit = 4) {
	const db = createDb(d1);
	const notDraftCat = sql`${products.categoryId} IS NULL OR ${products.categoryId} NOT IN (SELECT ${categories.id} FROM ${categories} WHERE ${categories.status} = 'draft')`;
	const picks = await db.select().from(featuredProducts).orderBy(asc(featuredProducts.sort)).limit(limit).all();
	const ids = picks.map((p) => p.productId);
	const picked = ids.length
		? await db
				.select()
				.from(products)
				.where(and(inArray(products.id, ids), eq(products.status, 'active'), notDraftCat))
				.all()
		: [];
	const byId = new Map(picked.map((p) => [p.id, p]));
	const ordered = picks.flatMap((p) => byId.get(p.productId) ?? []);
	const need = limit - ordered.length;
	let backfill: typeof ordered = [];
	if (need > 0) {
		backfill = await db
			.select()
			.from(products)
			.where(
				and(
					eq(products.status, 'active'),
					notDraftCat,
					ordered.length ? notInArray(products.id, ordered.map((p) => p.id)) : undefined
				)
			)
			.orderBy(desc(products.updatedAt))
			.limit(need)
			.all();
	}
	const all = [...ordered, ...backfill];
	return Promise.all(
		all.map(async (p) => {
			const img = await db
				.select()
				.from(productImages)
				.where(eq(productImages.productId, p.id))
				.orderBy(productImages.sort)
				.limit(1)
				.get();
			return { ...p, image: img ? { ...img, url: imageUrl(env, img.r2Key) } : null };
		})
	);
}
