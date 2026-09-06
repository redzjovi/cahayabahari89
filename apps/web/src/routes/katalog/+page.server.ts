import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, url }) => {
	const q = url.searchParams.get('q') ?? undefined;
	const cat = url.searchParams.get('cat') ?? undefined;
	const min = url.searchParams.get('min') ?? undefined;
	const max = url.searchParams.get('max') ?? undefined;
	const sort = url.searchParams.get('sort') ?? 'best';
	const page = Number(url.searchParams.get('page') ?? 1);

	// Fetch via embedded Hono (same origin) — works both local and CF
	const params = new URLSearchParams();
	if (q) params.set('q', q);
	if (cat) params.set('cat', cat);
	if (min) params.set('minPrice', min);
	if (max) params.set('maxPrice', max);
	params.set('sort', sort);
	params.set('page', String(page));
	params.set('limit', '12');

	const res = await fetch(`/api/products?${params.toString()}`);
	if (!res.ok) {
		return { products: [], total: 0, page, limit: 12, q, cat, min, max, sort, error: 'Failed to load products (DB not migrated yet)' };
	}
	const data = await res.json() as { products: unknown[]; total: number; page: number; limit: number };

	// Also fetch categories for filter
	let categories: unknown[] = [];
	try {
		const cRes = await fetch('/api/categories');
		if (cRes.ok) categories = await cRes.json();
	} catch {}

	return { ...data, categories, q, cat, min, max, sort };
};
