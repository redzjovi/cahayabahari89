// See https://svelte.dev/docs/kit/types#app.d.ts
/// <reference types="@cloudflare/workers-types" />
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				DB: D1Database;
				IMAGES: R2Bucket;
				ADMIN_TOKEN?: string;
				RESEND_API_KEY?: string;
			};
			cf?: CfProperties;
			ctx?: ExecutionContext;
			caches?: CacheStorage;
		}
	}
}

export {};
