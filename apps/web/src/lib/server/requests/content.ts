import { z } from 'zod';

export const contentPageSchema = z.enum(['home', 'about', 'contact', 'site']);
export const contentLocaleSchema = z.enum(['id', 'en']);

const sectionSchema = z.object({
	key: z.string().min(1).max(120),
	heading: z.string().max(200).nullable().optional(),
	body: z.string().max(5000).nullable().optional(),
	imageUrl: z.string().max(1000).nullable().optional(),
	sort: z.number().int().min(0).max(9999).optional()
});

export const upsertPageSchema = z.object({
	locale: contentLocaleSchema,
	sections: z.array(sectionSchema).min(1).max(100)
});
export type UpsertPage = z.infer<typeof upsertPageSchema>;
