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

	/** Load /auth/me; returns false (and caller redirects) when not logged in. */
	async refresh(): Promise<boolean> {
		if (!this.token) {
			this.user = null;
			return false;
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

	async logout() {
		try {
			await this.api('/api/auth/logout', { method: 'POST' });
		} catch {
			// ignore — local state clears regardless
		}
		this.setToken(null);
		this.user = null;
		await goto('/admin/login');
	}

	can(perm: string): boolean {
		return this.user?.permissions.includes(perm) ?? false;
	}
}

export const adminSession = new AdminSession();
