import { createQuery } from '@tanstack/svelte-query';
import { fetchJson } from './fetcher';
import { qk } from './keys';
import type { AdminUser } from '$lib/admin-session.svelte';

/** Shared auth/me query — deduped across layout + all child pages.
 *  5m staleTime avoids re-fetch on every navigation; invalidated on login/logout/role/profile changes.
 */
export function createAuthQuery(enabled: () => boolean) {
	return createQuery(() => ({
		queryKey: qk.authMe(),
		enabled: enabled(),
		staleTime: 5 * 60_000,
		gcTime: 15 * 60_000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: true,
		retry: false,
		queryFn: async ({ signal }) => fetchJson<{ data: AdminUser }>('/api/auth/me', { signal })
	}));
}
