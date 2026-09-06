import { parseLocalized } from '$lib/routes';

/**
 * Localized URLs (/en/…, /id/…) rewrite to canonical internal routes.
 * NOTE: `reroute` must live here (universal hooks), not in hooks.server.ts —
 * SvelteKit only loads it from the universal hooks module.
 * @type {import('@sveltejs/kit').Reroute}
 */
export function reroute({ url }) {
	const parsed = parseLocalized(url.pathname);
	if (parsed) return parsed.internal;
}
