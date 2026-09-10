import { z } from 'zod';

export const slugRule = z
	.string()
	.min(2)
	.max(60)
	.regex(/^[a-z0-9._-]+$/, 'lowercase letters, numbers, dot, underscore, dash only');

/** Shared pagination query shape for list endpoints. */
export const paginationQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(10)
});
