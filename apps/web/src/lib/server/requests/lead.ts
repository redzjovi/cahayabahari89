import { z } from 'zod';

export const contactSchema = z.object({
	name: z.string().min(2).max(100),
	email: z.string().email(),
	company: z.string().max(150).optional(),
	volume: z.string().max(60).optional(),
	message: z.string().min(10).max(2000)
});
export type ContactInput = z.infer<typeof contactSchema>;

export const leadsSortSchema = z
	.enum(['created_asc', 'created_desc', 'name_asc', 'name_desc', 'email_asc', 'email_desc'])
	.default('created_desc');

export const leadsFilterSchema = z.object({
	name: z.string().trim().min(1).max(200).optional(),
	email: z.string().trim().min(1).max(254).optional()
});
