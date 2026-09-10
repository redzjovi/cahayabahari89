import { z } from 'zod';

export const productSortSchema = z
	.enum(['best', 'name_asc', 'name_desc', 'price_asc', 'price_desc', 'updated_desc', 'updated_asc', 'status_asc', 'status_desc'])
	.default('updated_desc');

export const productsQuerySchema = z.object({
	q: z.string().optional(),
	cat: z.string().optional(),
	minPrice: z.coerce.number().int().min(0).optional(),
	maxPrice: z.coerce.number().int().min(0).optional(),
	sort: productSortSchema,
	status: z.enum(['active', 'draft', 'all']).default('active'),
	page: z.coerce.number().min(1).default(1),
	limit: z.coerce.number().min(1).max(100).default(20)
});
export type ProductsQuery = z.infer<typeof productsQuerySchema>;

export const storeProductSchema = z.object({
	sku: z.string().optional(),
	name: z.string().min(2).max(150),
	description: z.string().max(5000).optional(),
	price: z.number().int().min(0),
	categoryId: z.number().int().optional(),
	status: z.enum(['active', 'draft']).default('active')
});
export type StoreProduct = z.infer<typeof storeProductSchema>;

export const updateProductSchema = z.object({
	sku: z.string().optional(),
	name: z.string().min(2).max(150).optional(),
	description: z.string().max(5000).optional(),
	price: z.number().int().min(0).optional(),
	categoryId: z.number().int().nullable().optional(),
	status: z.enum(['active', 'draft']).optional()
});
export type UpdateProduct = z.infer<typeof updateProductSchema>;
