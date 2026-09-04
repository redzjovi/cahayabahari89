import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, fetch }) => {
		const data = await request.formData();
		const payload = {
			name: String(data.get('name') ?? ''),
			email: String(data.get('email') ?? ''),
			message: String(data.get('message') ?? '')
		};
		// POST to embedded Hono (same origin, no CORS needed)
		const res = await fetch('/api/contact', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(payload)
		});
		if (!res.ok) {
			const err = (await res.json().catch(() => ({}))) as { error?: unknown };
			return { error: err.error ? JSON.stringify(err.error) : 'Failed to send', ok: false };
		}
		return { ok: true };
	}
};
