import type { LayoutServerLoad } from './$types';

/** Locale comes from the URL prefix (/en/… or /id/…); bare URLs never reach here (301 in hooks). */
export const load: LayoutServerLoad = ({ url }) => {
	const seg = url.pathname.split('/').filter(Boolean)[0];
	return { locale: (seg === 'en' ? 'en' : 'id') as 'en' | 'id' };
};
