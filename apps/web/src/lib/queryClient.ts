import { QueryClient } from '@tanstack/svelte-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 45_000,
			gcTime: 10 * 60_000,
			refetchOnWindowFocus: false,
			retry: 1,
			networkMode: 'always' as const
		},
		mutations: {
			retry: 0
		}
	}
});
