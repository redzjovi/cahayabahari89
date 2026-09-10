import { z } from 'zod';
import { slugRule } from './common';

export const permissionsSortSchema = z.enum(['slug_asc', 'slug_desc', 'name_asc', 'name_desc']).default('slug_asc');

export const storePermissionSchema = z.object({ slug: slugRule, name: z.string().min(2).max(100) });
export type StorePermission = z.infer<typeof storePermissionSchema>;

export const updatePermissionSchema = z.object({ name: z.string().min(2).max(100) });
export type UpdatePermission = z.infer<typeof updatePermissionSchema>;
