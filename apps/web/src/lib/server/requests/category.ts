import { z } from 'zod';
import { slugRule } from './common';

export const categoriesSortSchema = z.enum(['name_asc', 'name_desc', 'slug_asc', 'slug_desc']).default('name_asc');

export const storeCategorySchema = z.object({ slug: slugRule, name: z.string().min(2).max(100) });
export type StoreCategory = z.infer<typeof storeCategorySchema>;

export const updateCategorySchema = z.object({ name: z.string().min(2).max(100) });
export type UpdateCategory = z.infer<typeof updateCategorySchema>;
