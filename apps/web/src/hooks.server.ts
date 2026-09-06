import { redirect } from '@sveltejs/kit';
import app from '$lib/server/hono';
import { toIdRedirect } from '$lib/routes';

export async function handle({ event, resolve }) {
	// Embed Hono at /api/*
	if (event.url.pathname.startsWith('/api/')) {
		// Hono expects Cloudflare bindings via platform.env
		// SvelteKit provides platform.env on CF adapter
		const platform = event.platform as unknown as { env?: Record<string, unknown> } | undefined;
		const env = (platform?.env ?? {}) as Record<string, unknown>;
		// If running locally without CF, stub DB as undefined — Hono will error gracefully
		return app.fetch(event.request, env as never);
	}
	// Bare/legacy URLs (/…​) redirect to their /id/… equivalent (query preserved).
	// Valid localized URLs and unknown paths fall through (unknown -> SvelteKit 404).
	if (event.url.pathname !== '/sitemap.xml') {
		const target = toIdRedirect(event.url.pathname);
		if (target) throw redirect(301, target + event.url.search);
	}
	return resolve(event);
}
