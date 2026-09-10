import { z } from 'zod';

export const usersSortSchema = z
	.enum(['created_desc', 'created_asc', 'email_asc', 'email_desc', 'name_asc', 'name_desc', 'status_asc', 'status_desc'])
	.default('created_desc');

export const usersFilterSchema = z.object({
	email: z.string().trim().min(1).max(254).optional(),
	name: z.string().trim().min(1).max(200).optional(),
	status: z.enum(['active', 'suspended']).optional()
});

export const storeUserSchema = z.object({
	email: z.string().email(),
	name: z.string().min(2).max(100),
	password: z.string().min(8).max(200),
	roles: z.array(z.string()).default([])
});
export type StoreUser = z.infer<typeof storeUserSchema>;

export const updateUserSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	status: z.enum(['active', 'suspended']).optional(),
	password: z.string().min(8).max(200).optional(),
	roles: z.array(z.string()).optional()
});
export type UpdateUser = z.infer<typeof updateUserSchema>;
