import type { PageServerLoad } from './$types';
import { loadSections } from '$lib/server/content';

export const load: PageServerLoad = async ({ fetch, platform, url }) => {
	const seg = url.pathname.split('/').filter(Boolean)[0];
	const locale = (seg === 'en' ? 'en' : 'id') as 'en' | 'id';
	let featured: unknown[] = [];
	try {
		const res = await fetch('/api/products?page=1&limit=4');
		if (res.ok) featured = ((await res.json()) as { data: unknown[] }).data ?? [];
	} catch {
		featured = [];
	}
	let sections = {};
	if (platform?.env?.DB) sections = await loadSections(platform.env.DB, 'home', locale);
	return { featured, sections, locale };
};
