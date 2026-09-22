import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		wranglerConfigPath: './wrangler.jsonc',
		databaseId: '17c04c23-cefa-42fb-b274-1c290d1146af'
	}
});
