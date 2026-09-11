import { z } from 'zod';

export const categoriesSortSchema = z
	.enum(['name_asc', 'name_desc', 'slug_asc', 'slug_desc', 'status_asc', 'status_desc', 'products_asc', 'products_desc'])
	.default('name_asc');

/** Slug is server-generated as slugify(name)-<id> (product-style); clients send name only. */
export const storeCategorySchema = z.object({
	name: z.string().min(2).max(100),
	status: z.enum(['active', 'draft']).default('active')
});
export type StoreCategory = z.infer<typeof storeCategorySchema>;

export const updateCategorySchema = z.object({
	name: z.string().min(2).max(100).optional(),
	status: z.enum(['active', 'draft']).optional()
});
export type UpdateCategory = z.infer<typeof updateCategorySchema>;

export const categoriesFilterSchema = z.object({
	q: z.string().max(100).optional(),
	status: z.enum(['active', 'draft', 'all']).default('all')
});
export type CategoriesFilter = z.infer<typeof categoriesFilterSchema>;
