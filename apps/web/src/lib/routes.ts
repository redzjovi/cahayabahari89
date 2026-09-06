import type { Locale } from './locale.svelte';

/**
 * Single source of truth for multilingual routing.
 * Physical SvelteKit routes stay canonical/internal (/, /products, /contact);
 * localized URLs (/en/…, /id/…) are mapped here and applied via reroute + redirects.
 */

// internal base -> localized base, per locale
const TABLE: Record<Locale, Record<string, string>> = {
	en: { '/': '/en', '/products': '/en/products', '/contact': '/en/contact', '/admin': '/en/admin' },
	id: { '/': '/id', '/products': '/id/produk', '/contact': '/id/kontak', '/admin': '/id/admin' }
};

// localized first slug -> internal base ('': locale root -> home)
const REVERSE: Record<string, string> = {
	'': '/',
	products: '/products',
	produk: '/products',
	contact: '/contact',
	kontak: '/contact',
	admin: '/admin'
};

export function isLocale(seg: string): seg is Locale {
	return seg === 'en' || seg === 'id';
}

/** Parse a localized pathname. Null = no valid locale prefix (bare/legacy/unknown). */
export function parseLocalized(pathname: string): { locale: Locale; internal: string } | null {
	const segs = pathname.split('/').filter(Boolean);
	if (!segs.length || !isLocale(segs[0])) return null;
	const [locale, head = '', ...tail] = segs;
	const base = REVERSE[head];
	if (base === undefined) return null; // valid locale, unknown slug -> SvelteKit 404
	return { locale, internal: base + (tail.length ? '/' + tail.join('/') : '') };
}

function splitQuery(internalPath: string): [string, string] {
	const i = internalPath.indexOf('?');
	return i === -1 ? [internalPath, ''] : [internalPath.slice(0, i), internalPath.slice(i)];
}

/** Map an internal path (e.g. /products/x?q=1) to a localized URL. Unknown bases pass through. */
export function localize(internalPath: string, loc: Locale): string {
	const [path, query] = splitQuery(internalPath);
	const segs = path.split('/').filter(Boolean);
	const base = '/' + (segs[0] ?? '');
	const tail = segs.slice(1).join('/');
	const localizedBase = TABLE[loc][base] ?? path;
	const out = localizedBase + (tail ? '/' + tail : '');
	return out + query;
}

/** Switch a localized (or bare) URL to another locale, preserving page + query. */
export function switchLocale(pathname: string, search: string, loc: Locale): string {
	const parsed = parseLocalized(pathname);
	const internal = parsed ? parsed.internal : pathname;
	return localize(internal + search, loc);
}

/**
 * Bare/legacy pathname -> /id/… redirect target (query appended by caller).
 * Null = either already localized (let through) or unknown (let SvelteKit 404).
 */
export function toIdRedirect(pathname: string): string | null {
	if (parseLocalized(pathname)) return null;
	if (pathname === '/' || pathname === '') return '/id';
	const segs = pathname.split('/').filter(Boolean);
	const [first, ...rest] = segs;
	// legacy katalog URLs fold into the rename target
	if (first === 'katalog') return '/id/produk' + (rest.length ? '/' + rest.join('/') : '');
	const base = REVERSE[first];
	if (base === undefined) return null;
	const idBase = TABLE.id[base];
	if (!idBase) return null;
	return idBase + (rest.length ? '/' + rest.join('/') : '');
}
