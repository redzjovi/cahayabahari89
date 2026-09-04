import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		wrangerConfigPath: './wrangler.jsonc',
		databaseId: 'ca94baff-e473-475c-a22e-571e6f1a415c'
	}
});
