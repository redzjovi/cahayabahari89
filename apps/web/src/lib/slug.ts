/**
 * URL-safe base from a product name. Parenthetical annotations (e.g. pack
 * size notes) are display-only and excluded. Empty if nothing usable remains.
 */
export function slugify(name: string): string {
	return name
		.toLowerCase()
		.replace(/\(.*?\)/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

/** Canonical product slug: human-readable base + immutable numeric id. */
export function productSlug(name: string, id: number): string {
	const base = slugify(name) || 'product';
	return `${base}-${id}`;
}
