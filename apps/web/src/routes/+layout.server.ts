import type { LayoutServerLoad } from './$types';
import { loadMenus, loadSections } from '$lib/server/content';

/** Fallback WhatsApp number when CMS contact.whatsapp is empty. */
const WA_FALLBACK = '6287877118199';

/** Locale comes from the URL prefix (/en/… or /id/…); bare URLs never reach here (301 in hooks). */
export const load: LayoutServerLoad = async ({ url, platform }) => {
	const seg = url.pathname.split('/').filter(Boolean)[0];
	const locale = (seg === 'en' ? 'en' : 'id') as 'en' | 'id';
	if (!platform?.env?.DB)
		return { locale, menus: { header: [], social: [] }, sections: {}, waNumber: WA_FALLBACK };
	const d1 = platform.env.DB;
	const [header, social, sections, contact] = await Promise.all([
		loadMenus(d1, 'header', locale),
		loadMenus(d1, 'social', locale),
		loadSections(d1, 'site', locale),
		loadSections(d1, 'contact', locale)
	]);
	const waNumber = contact['contact.whatsapp']?.body?.trim() || WA_FALLBACK;
	return { locale, menus: { header, social }, sections, waNumber };
};
