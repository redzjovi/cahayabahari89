import type { PageServerLoad } from './$types';
import { loadSections } from '$lib/server/content';

export const load: PageServerLoad = async ({ platform, url }) => {
	const seg = url.pathname.split('/').filter(Boolean)[0];
	const locale = (seg === 'en' ? 'en' : 'id') as 'en' | 'id';
	if (!platform?.env?.DB) return { sections: {}, locale };
	return { sections: await loadSections(platform.env.DB, 'about', locale), locale };
};
