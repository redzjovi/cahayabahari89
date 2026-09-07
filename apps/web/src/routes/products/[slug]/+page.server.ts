import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, fetch, url }) => {
	const apiUrl = `/api/products/${params.slug}`;
	const res = await fetch(apiUrl);
	if (res.status === 301 || res.status === 308) {
		// Renamed slug: the API points at the current slug URL. SvelteKit's
		// server fetch does not follow same-origin redirects, so translate
		// the API Location into a page-level 301 for the browser + SEO.
		const loc = new URL(res.headers.get('location') ?? '', url.origin);
		const newSlug = loc.pathname.split('/').filter(Boolean).pop() ?? params.slug;
		const path = url.pathname.split('/');
		path[path.length - 1] = newSlug;
		throw redirect(301, path.join('/') + url.search);
	}
	if (!res.ok) throw error(404, 'Product not found');
	const product = (await res.json()) as { categoryId?: number | null; category?: { slug: string } | null; slug: string };

	// The API 301s renamed slugs to the current one (fetch follows silently).
	// Detect it via res.url and surface a page-level 301 so the browser
	// address bar + SEO end up on the canonical URL.
	if (product.slug !== params.slug) {
		const path = url.pathname.split('/');
		path[path.length - 1] = product.slug;
		throw redirect(301, path.join('/') + url.search);
	}

	// Related: same category, exclude self
	let related: unknown[] = [];
	try {
		const cat = product.category?.slug;
		if (cat) {
			const r = await fetch(`/api/products?cat=${encodeURIComponent(cat)}&limit=4`);
			if (r.ok) {
				const data = (await r.json()) as { items: { slug: string }[] };
				related = (data.items ?? []).filter((p) => p.slug !== product.slug).slice(0, 3);
			}
		}
		if (!related.length) {
			const r = await fetch('/api/products?limit=4');
			if (r.ok) {
				const data = (await r.json()) as { items: { slug: string }[] };
				related = (data.items ?? []).filter((p) => p.slug !== product.slug).slice(0, 3);
			}
		}
	} catch {
		// non-fatal
	}

	return { product, related };
};
