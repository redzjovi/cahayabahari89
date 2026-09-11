import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { auth, need, type Env } from '../http/middleware';
import { validationHook } from '../http/response';
import { paginationQuerySchema } from '../requests/common';
import { productsQuerySchema, storeProductSchema, updateProductSchema } from '../requests/product';
import { categoriesSortSchema, storeCategorySchema, updateCategorySchema, categoriesFilterSchema } from '../requests/category';
import { contactSchema, leadsFilterSchema, leadsSortSchema } from '../requests/lead';
import { storeUserSchema, updateUserSchema, usersFilterSchema, usersSortSchema } from '../requests/user';
import { storeMenuSchema, updateMenuSchema } from '../requests/menu';
import { upsertPageSchema } from '../requests/content';
import { storeRoleSchema, updateRoleSchema } from '../requests/role';
import { permissionsSortSchema, storePermissionSchema, updatePermissionSchema } from '../requests/permission';
import { loginSchema } from '../requests/auth';
import { show as health } from '../controllers/HealthController';
import { serve as serveImage } from '../controllers/ImageController';
import { list as listCategories } from '../controllers/CategoryController';
import { list as listProducts, show as showProduct } from '../controllers/ProductController';
import { list as listMenus } from '../controllers/MenuController';
import { show as showPage } from '../controllers/ContentController';
import * as AdminMenu from '../controllers/MenuController';
import * as AdminContent from '../controllers/ContentController';
import * as AdminContentImage from '../controllers/admin/ContentImageController';
import { store as storeContact } from '../controllers/ContactController';
import * as AdminProduct from '../controllers/admin/ProductController';
import * as AdminCategory from '../controllers/admin/CategoryController';
import * as AdminLead from '../controllers/admin/LeadController';
import * as AdminImage from '../controllers/admin/ImageController';
import * as AdminUser from '../controllers/admin/UserController';
import * as AdminRole from '../controllers/admin/RoleController';
import * as AdminPermission from '../controllers/admin/PermissionController';
import * as Auth from '../controllers/admin/AuthController';

/** Single route registry (Laravel routes/api.php equivalent).
 * Mounted at /api by hono.ts — paths below are relative to /api. */
const api = new Hono<Env>();

// ── Public ──
api.get('/health', health);
api.get('/images/:key{.+$}', serveImage);
api.get('/categories', zValidator('query', paginationQuerySchema.extend({ sort: categoriesSortSchema }), validationHook), listCategories);
api.get('/products', zValidator('query', productsQuerySchema, validationHook), listProducts);
api.get('/products/:slug', showProduct);
api.post('/contact', zValidator('json', contactSchema, validationHook), storeContact);
api.get('/menus', listMenus);
api.get('/pages/:page', showPage);

// ── Admin: products (RBAC: products.write) ──
api.post('/admin/products', auth, need('products.write'), zValidator('json', storeProductSchema, validationHook), AdminProduct.store);
api.patch('/admin/products/:slug', auth, need('products.write'), zValidator('json', updateProductSchema, validationHook), AdminProduct.update);
api.delete('/admin/products/:slug', auth, need('products.write'), AdminProduct.destroy);

// ── Admin: categories (RBAC: categories.write) ──
api.get(
	'/admin/categories',
	auth,
	need('categories.write'),
	zValidator('query', paginationQuerySchema.extend({ sort: categoriesSortSchema }).extend(categoriesFilterSchema.shape), validationHook),
	AdminCategory.index
);
api.post('/admin/categories', auth, need('categories.write'), zValidator('json', storeCategorySchema, validationHook), AdminCategory.store);
api.patch('/admin/categories/:slug', auth, need('categories.write'), zValidator('json', updateCategorySchema, validationHook), AdminCategory.update);
api.delete('/admin/categories/:slug', auth, need('categories.write'), AdminCategory.destroy);

// ── Admin: leads (RBAC: leads.read) ──
api.get(
	'/admin/leads',
	auth,
	need('leads.read'),
	zValidator('query', paginationQuerySchema.extend({ sort: leadsSortSchema }).extend(leadsFilterSchema.shape), validationHook),
	AdminLead.index
);
api.get('/admin/leads/:id', auth, need('leads.read'), AdminLead.show);

// ── Admin: images (RBAC: images.write) ──
api.post('/admin/images', auth, need('images.write'), AdminImage.store);
api.patch('/admin/images/reorder', auth, need('images.write'), AdminImage.reorder);
api.delete('/admin/images/:id', auth, need('images.write'), AdminImage.destroy);

// ── Admin: menus + page content (RBAC: content.manage) ──
api.get('/admin/menus', auth, need('content.manage'), zValidator('query', paginationQuerySchema, validationHook), AdminMenu.adminIndex);
api.get('/admin/menus/:id', auth, need('content.manage'), AdminMenu.show);
api.patch('/admin/menus/reorder', auth, need('content.manage'), AdminMenu.reorder);
api.post('/admin/menus', auth, need('content.manage'), zValidator('json', storeMenuSchema, validationHook), AdminMenu.store);
api.patch('/admin/menus/:id', auth, need('content.manage'), zValidator('json', updateMenuSchema, validationHook), AdminMenu.update);
api.delete('/admin/menus/:id', auth, need('content.manage'), AdminMenu.destroy);
api.put('/admin/pages/:page', auth, need('content.manage'), zValidator('json', upsertPageSchema, validationHook), AdminContent.upsert);
api.post('/admin/content/images', auth, need('content.manage'), AdminContentImage.uploadContentImage);
api.delete('/admin/content/images', auth, need('content.manage'), AdminContentImage.deleteContentImage);

// ── Admin: users (RBAC: users.manage) ──
api.get(
	'/admin/users',
	auth,
	need('users.manage'),
	zValidator('query', paginationQuerySchema.extend({ sort: usersSortSchema }).extend(usersFilterSchema.shape), validationHook),
	AdminUser.index
);
api.post('/admin/users', auth, need('users.manage'), zValidator('json', storeUserSchema, validationHook), AdminUser.store);
api.patch('/admin/users/:id', auth, need('users.manage'), zValidator('json', updateUserSchema, validationHook), AdminUser.update);

// ── Admin: roles (RBAC: roles.manage) ──
api.get('/admin/roles', auth, need('roles.manage'), zValidator('query', paginationQuerySchema, validationHook), AdminRole.index);
api.post('/admin/roles', auth, need('roles.manage'), zValidator('json', storeRoleSchema, validationHook), AdminRole.store);
api.patch('/admin/roles/:slug', auth, need('roles.manage'), zValidator('json', updateRoleSchema, validationHook), AdminRole.update);
api.delete('/admin/roles/:slug', auth, need('roles.manage'), AdminRole.destroy);

// ── Admin: permissions (RBAC: roles.manage; slugs immutable once created) ──
api.get(
	'/admin/permissions',
	auth,
	need('roles.manage'),
	zValidator('query', paginationQuerySchema.extend({ sort: permissionsSortSchema }), validationHook),
	AdminPermission.index
);
api.post('/admin/permissions', auth, need('roles.manage'), zValidator('json', storePermissionSchema, validationHook), AdminPermission.store);
api.patch('/admin/permissions/:slug', auth, need('roles.manage'), zValidator('json', updatePermissionSchema, validationHook), AdminPermission.update);
api.delete('/admin/permissions/:slug', auth, need('roles.manage'), AdminPermission.destroy);

// ── Auth: sessions (RBAC) ──
api.post('/auth/login', zValidator('json', loginSchema, validationHook), Auth.login);
api.post('/auth/logout', Auth.logout);
api.get('/auth/me', auth, Auth.me);

export default api;
