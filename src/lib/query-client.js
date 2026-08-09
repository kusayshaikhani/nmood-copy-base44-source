import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			// PERF-001: avoid refetching on every mount; data is considered fresh
			// for 30s and kept in the cache 5min after leaving a screen.
			staleTime: 30_000,
			gcTime: 5 * 60_000,
			retry: 1,
		},
	},
});