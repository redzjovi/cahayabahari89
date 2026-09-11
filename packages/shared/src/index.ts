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

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1)
});

const slugRule = z
	.string()
	.min(2)
	.max(60)
	.regex(/^[a-z0-9._-]+$/, 'lowercase letters, numbers, dot, underscore, dash only');

export const adminUserCreateSchema = z.object({
	email: z.string().email(),
	name: z.string().min(2).max(100),
	password: z.string().min(8).max(200),
	roles: z.array(z.string()).default([])
});

export const adminUserPatchSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	status: z.enum(['active', 'suspended']).optional(),
	password: z.string().min(8).max(200).optional(),
	roles: z.array(z.string()).optional()
});

export const adminRoleCreateSchema = z.object({
	slug: slugRule,
	name: z.string().min(2).max(100),
	permissions: z.array(z.string()).default([])
});

export const adminRolePatchSchema = z.object({
	name: z.string().min(2).max(100).optional(),
	permissions: z.array(z.string()).optional()
});

export const adminPermissionCreateSchema = z.object({
	slug: slugRule,
	name: z.string().min(2).max(100)
});

export const adminPermissionPatchSchema = z.object({
	name: z.string().min(2).max(100)
});

export const adminProductPatchSchema = z.object({
	sku: z.string().optional(),
	name: z.string().min(2).max(150).optional(),
	description: z.string().max(5000).optional(),
	price: z.number().int().min(0).optional(),
	categoryId: z.number().int().nullable().optional(),
	status: z.enum(['active', 'draft']).optional()
});

export const adminCategoryCreateSchema = z.object({
	slug: slugRule,
	name: z.string().min(2).max(100)
});

export const adminCategoryPatchSchema = z.object({
	name: z.string().min(2).max(100)
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

export const menuLocationSchema = z.enum(['header', 'social']);

export const storeMenuSchema = z.object({
	location: menuLocationSchema,
	labelEn: z.string().max(100).default(''),
	labelId: z.string().max(100).default(''),
	href: z.string().min(1).max(500),
	sort: z.number().int().min(0).max(9999).default(0),
	visible: z.boolean().default(true)
});

export const updateMenuSchema = z.object({
	location: menuLocationSchema.optional(),
	labelEn: z.string().max(100).optional(),
	labelId: z.string().max(100).optional(),
	href: z.string().min(1).max(500).optional(),
	sort: z.number().int().min(0).max(9999).optional(),
	visible: z.boolean().optional()
});

export const upsertPageSchema = z.object({
	locale: z.enum(['id', 'en']),
	sections: z
		.array(
			z.object({
				key: z.string().min(1).max(120),
				heading: z.string().max(200).nullable().optional(),
				body: z.string().max(5000).nullable().optional(),
				imageUrl: z.string().max(1000).nullable().optional(),
				sort: z.number().int().min(0).max(9999).optional()
			})
		)
		.min(1)
		.max(100)
});
