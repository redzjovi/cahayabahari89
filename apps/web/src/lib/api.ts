/** Laravel-style envelope helpers shared by SvelteKit loads + admin pages. */

export type ApiMeta = { page: number; limit: number; total: number };
export type ApiList<T> = { data: T[]; meta: ApiMeta };
export type ApiSingle<T> = { data: T; message?: string };
export type ApiErrorBody = {
	message?: string;
	errors?: Record<string, string[] | string>;
	error?: string; // legacy fallback (pre-envelope responses)
	count?: number;
};

/** Extract human-readable message: message -> flattened errors -> legacy error -> fallback. */
export function apiMessage(json: unknown, fallback = ''): string {
	const b = (json ?? {}) as ApiErrorBody;
	if (typeof b.message === 'string' && b.message) {
		if (b.errors && typeof b.errors === 'object') {
			const first = Object.values(b.errors).flat().find(Boolean);
			if (first) return `${b.message}: ${first}`;
		}
		return b.message;
	}
	if (b.errors && typeof b.errors === 'object') {
		const first = Object.values(b.errors).flat().find(Boolean);
		if (first) return String(first);
	}
	if (typeof b.error === 'string' && b.error) return b.error;
	return fallback;
}

/** Unwrap list envelope with legacy { items, total } fallback. */
export function unwrapList<T>(json: unknown): { items: T[]; total: number; page: number; limit: number } {
	const b = json as Partial<ApiList<T>> & { items?: T[]; total?: number; page?: number; limit?: number };
	if (Array.isArray(b.data)) {
		return {
			items: b.data,
			total: b.meta?.total ?? b.data.length,
			page: b.meta?.page ?? 1,
			limit: b.meta?.limit ?? b.data.length
		};
	}
	return { items: b.items ?? [], total: b.total ?? 0, page: b.page ?? 1, limit: b.limit ?? (b.items?.length ?? 0) };
}

/** Unwrap single envelope with legacy raw-row fallback. */
export function unwrapData<T>(json: unknown): T {
	const b = json as Partial<ApiSingle<T>>;
	if (b && typeof b === 'object' && 'data' in b && b.data !== undefined) return b.data as T;
	return json as T;
}
