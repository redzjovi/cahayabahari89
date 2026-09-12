import { z } from 'zod';

export const MAX_FEATURED = 4;

export const setFeaturedSchema = z.object({
	productIds: z.array(z.number().int().positive()).max(MAX_FEATURED)
});
export type SetFeatured = z.infer<typeof setFeaturedSchema>;
