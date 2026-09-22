import { adminSession } from '$lib/admin-session.svelte';

export type ApiList<T> = { data: T[]; meta: { total: number; page: number; limit: number } };
export type ApiSingle<T> = { data: T };

/** Authenticated fetch that forwards TanStack's abort signal and reuses adminSession token/401 logic. */
export async function adminFetch(path: string, opts: RequestInit & { signal?: AbortSignal } = {}): Promise<Response> {
	const { signal, ...rest } = opts;
	return adminSession.api(path, { ...rest, signal } as RequestInit);
}

export async function fetchJson<T>(path: string, opts: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
	const res = await adminFetch(path, opts);
	if (!res.ok) {
		let body: unknown = null;
		try {
			body = await res.json();
		} catch {}
		const msg = (body as { message?: string })?.message || `Request failed: ${res.status}`;
		throw new Error(msg);
	}
	return (await res.json()) as T;
}

/** For public GETs (optional token if admin is logged in). Shares same token header logic. */
export async function publicFetchJson<T>(path: string, opts: RequestInit & { signal?: AbortSignal } = {}): Promise<T> {
	const res = await adminFetch(path, opts);
	if (!res.ok) {
		let body: unknown = null;
		try {
			body = await res.json();
		} catch {}
		const msg = (body as { message?: string })?.message || `Request failed: ${res.status}`;
		throw new Error(msg);
	}
	return (await res.json()) as T;
}
