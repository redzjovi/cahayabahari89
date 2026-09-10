import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/products?page=1&limit=4');
		if (!res.ok) return { featured: [] };
		const body = (await res.json()) as { data: unknown[] };
		return { featured: body.data ?? [] };
	} catch {
		return { featured: [] };
	}
};
