import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	try {
		const res = await fetch('/api/products?page=1&limit=4');
		if (!res.ok) return { featured: [] };
		const data = (await res.json()) as { products: unknown[] };
		return { featured: data.products ?? [] };
	} catch {
		return { featured: [] };
	}
};
