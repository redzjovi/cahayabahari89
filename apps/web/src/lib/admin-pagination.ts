import { page as pageStore } from '$app/state';
import { goto } from '$app/navigation';

export type PageSize = 10 | 25 | 50 | 100;
export const PAGE_SIZES: PageSize[] = [10, 25, 50, 100];

/** Read a string from the current URL search params, optionally restricted to a set. */
export function readStringParam(name: string, allowed?: readonly string[]): string | null {
	const raw = pageStore.url.searchParams.get(name);
	if (raw === null) return null;
	if (allowed && !allowed.includes(raw)) return null;
	return raw;
}

/** Read a positive integer from the current URL search params. */
export function readIntParam(name: string, fallback: number, allowed?: number[]): number {
	const raw = pageStore.url.searchParams.get(name);
	if (raw === null) return fallback;
	const n = Number(raw);
	if (!Number.isFinite(n) || n < 1) return fallback;
	if (allowed && !allowed.includes(n)) return fallback;
	return n;
}

/** Build a search-param string preserving the path; set/replace keys in `set`. */
export function buildSearch(set: Record<string, string | number | undefined>): string {
	const u = new URL(pageStore.url);
	for (const [k, v] of Object.entries(set)) {
		if (v === undefined || v === '') u.searchParams.delete(k);
		else u.searchParams.set(k, String(v));
	}
	return u.pathname + (u.search ? u.search : '');
}

/** Navigate to a new URL on the same page (replaceState, no scroll, keep focus). */
export async function gotoSamePage(href: string): Promise<void> {
	await goto(href, { replaceState: true, noScroll: true, keepFocus: true });
}
