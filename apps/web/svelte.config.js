import adapter from '@sveltejs/adapter-cloudflare';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: true
	},
	kit: {
		adapter: adapter({
			// Workers deployment; Pages compatible
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			// Emulate platform.env (D1/R2/vars from wrangler.jsonc) in `vite dev`,
			// sharing .wrangler/state with `wrangler dev` (single local backend).
			platformProxy: {
				persist: true
			}
		})
	}
};

export default config;
