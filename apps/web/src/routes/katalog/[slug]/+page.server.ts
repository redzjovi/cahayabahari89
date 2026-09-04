import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch }) => {
	const res = await fetch(`/api/products/${params.slug}`);
	if (!res.ok) throw error(404, 'Product not found');
	const product = (await res.json()) as { categoryId?: number | null; category?: { slug: string } | null; slug: string };

	// Related: same category, exclude self
	let related: unknown[] = [];
	try {
		const cat = product.category?.slug;
		if (cat) {
			const r = await fetch(`/api/products?cat=${encodeURIComponent(cat)}&limit=4`);
			if (r.ok) {
				const data = (await r.json()) as { products: { slug: string }[] };
				related = (data.products ?? []).filter((p) => p.slug !== product.slug).slice(0, 3);
			}
		}
		if (!related.length) {
			const r = await fetch('/api/products?limit=4');
			if (r.ok) {
				const data = (await r.json()) as { products: { slug: string }[] };
				related = (data.products ?? []).filter((p) => p.slug !== product.slug).slice(0, 3);
			}
		}
	} catch {
		// non-fatal
	}

	return { product, related };
};
