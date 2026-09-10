import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const payload = {
			name: String(data.get('name') ?? ''),
			email: String(data.get('email') ?? ''),
			company: String(data.get('company') ?? '') || undefined,
			volume: String(data.get('volume') ?? '') || undefined,
			message: String(data.get('message') ?? '')
		};
		// POST to embedded Hono (same origin, no CORS needed)
		const res = await fetch('/api/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!res.ok) {
			const err = (await res.json().catch(() => ({}))) as { message?: unknown; errors?: Record<string, string[]> };
			return { error: err.message ? JSON.stringify(err.message) : err.errors ? JSON.stringify(err.errors) : 'Failed to send', ok: false };
		}
		return { ok: true };
	}
};
