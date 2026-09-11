import { z } from 'zod';

export const menuLocationSchema = z.enum(['header', 'social']);

export const storeMenuSchema = z.object({
	location: menuLocationSchema,
	labelEn: z.string().max(100).default(''),
	labelId: z.string().max(100).default(''),
	href: z.string().min(1).max(500),
	sort: z.number().int().min(0).max(9999).default(0),
	visible: z.boolean().default(true)
});
export type StoreMenu = z.infer<typeof storeMenuSchema>;

export const updateMenuSchema = z.object({
	location: menuLocationSchema.optional(),
	labelEn: z.string().max(100).optional(),
	labelId: z.string().max(100).optional(),
	href: z.string().min(1).max(500).optional(),
	sort: z.number().int().min(0).max(9999).optional(),
	visible: z.boolean().optional()
});
export type UpdateMenu = z.infer<typeof updateMenuSchema>;
