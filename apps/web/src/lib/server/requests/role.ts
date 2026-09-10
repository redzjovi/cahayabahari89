import { z } from 'zod';
import { slugRule } from './common';

export const storeRoleSchema = z.object({
	slug: slugRule,
	name: z.string().min(2).max(100),
	permissions: z.array(z.string()).default([])
});
export type StoreRole = z.infer<typeof storeRoleSchema>;

export const updateRoleSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	permissions: z.array(z.string()).optional()
});
export type UpdateRole = z.infer<typeof updateRoleSchema>;
