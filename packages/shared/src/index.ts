// Shared validation schemas (single source for Hono zod-validator + future clients).
// Keep in sync with apps/web/src/lib/server/hono.ts until workspace import is wired.
import { z } from 'zod';

export const productsQuerySchema = z.object({
	q: z.string().optional(),
	cat: z.string().optional(),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(50).default(12)
});

export const contactSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email(),
	company: z.string().max(150).optional(),
	volume: z.string().max(60).optional(),
	message: z.string().min(10).max(2000)
});

export const adminProductSchema = z.object({
	slug: z.string().min(2),
	sku: z.string().optional(),
	name: z.string().min(2),
	description: z.string().optional(),
	price: z.number().int().min(0),
	categoryId: z.number().int().optional(),
	status: z.enum(['active', 'draft']).default('active')
});
