import app from '$lib/server/hono';

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
	return resolve(event);
}
