import { browser } from '$app/environment';
import { goto } from '$app/navigation';

const KEY = 'cb89-admin-token';

export type AdminUser = {
	id: number;
	email: string;
	name: string;
	status: string;
	roles: string[];
	permissions: string[];
};

class AdminSession {
	token = $state<string | null>(null);
	user = $state<AdminUser | null>(null);

	init() {
		if (browser) this.token = localStorage.getItem(KEY);
	}

	setToken(t: string | null) {
		this.token = t;
		if (!browser) return;
		try {
			if (t) localStorage.setItem(KEY, t);
			else localStorage.removeItem(KEY);
		} catch {
			// ignore (private mode)
		}
	}

	async api(path: string, opts: RequestInit = {}): Promise<Response> {
		const headers = new Headers(opts.headers);
		if (this.token) headers.set('authorization', `Bearer ${this.token}`);
		if (opts.body !== undefined && !(opts.body instanceof FormData) && !headers.has('content-type')) {
			headers.set('content-type', 'application/json');
		}
		const res = await fetch(path, { ...opts, headers });
		if (res.status === 401) {
			this.setToken(null);
			this.user = null;
			throw new Error('unauthorized');
		}
		return res;
	}

	/** Raw bearer value for hand-rolled fetch calls (e.g. multipart uploads). */
	authHeader(): string {
		return this.token ? `Bearer ${this.token}` : '';
	}

	/** Load /auth/me; returns false (and caller redirects) when not logged in.
	 *  When TanStack is available (admin area), prefer the shared cached query via
	 *  `queryClient.fetchQuery(qk.authMe())` to dedup. Fallback to direct fetch
	 *  keeps login/profile pages working outside QueryClientProvider.
	 */
	async refresh(): Promise<boolean> {
		if (!this.token) {
			this.user = null;
			return false;
		}
		// Try cached query first (dedup + 5m staleTime)
		try {
			const { queryClient } = await import('$lib/queryClient');
			const { qk } = await import('$lib/queries/keys');
			const { fetchJson } = await import('$lib/queries/fetcher');
			// If queryClient has data, fetchQuery will return cached without network if fresh
			const data = await queryClient.fetchQuery({
				queryKey: qk.authMe(),
				staleTime: 5 * 60_000,
				queryFn: () => fetchJson<{ data: AdminUser }>('/api/auth/me')
			});
			this.user = data.data;
			return true;
		} catch {
			// fallback: direct fetch (e.g. outside provider or stale)
		}
		try {
			const res = await this.api('/api/auth/me');
			if (!res.ok) {
				this.user = null;
				return false;
			}
			const body = (await res.json()) as { data: AdminUser };
			this.user = body.data;
			return true;
		} catch {
			this.user = null;
			return false;
		}
	}

	/** Sync helper for TanStack auth query — called via $effect in layout. */
	syncFromQuery(data: AdminUser | null) {
		this.user = data;
	}

	async logout() {
		try {
			await this.api('/api/auth/logout', { method: 'POST' });
		} catch {
			// ignore — local state clears regardless
		}
		this.setToken(null);
		this.user = null;
		// Clear TanStack cache on logout to avoid stale admin data leaking
		try {
			const { queryClient } = await import('$lib/queryClient');
			queryClient.clear();
		} catch {}
		await goto('/admin/login');
	}

	can(perm: string): boolean {
		return this.user?.permissions.includes(perm) ?? false;
	}
}

export const adminSession = new AdminSession();
