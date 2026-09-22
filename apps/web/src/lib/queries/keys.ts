/** Central query key factory — keeps cache deduplication consistent. */
export const qk = {
	authMe: () => ['admin', 'auth', 'me'] as const,
	categories: (p: Record<string, unknown>) => ['admin', 'categories', p] as const,
	categoriesList: () => ['admin', 'categories', 'list'] as const,
	products: (p: Record<string, unknown>) => ['admin', 'products', p] as const,
	productsPublic: (p: Record<string, unknown>) => ['products', p] as const,
	users: (p: Record<string, unknown>) => ['admin', 'users', p] as const,
	leads: (p: Record<string, unknown>) => ['admin', 'leads', p] as const,
	menus: (p: Record<string, unknown>) => ['admin', 'menus', p] as const,
	roles: (p: Record<string, unknown>) => ['admin', 'roles', p] as const,
	perms: (p: Record<string, unknown>) => ['admin', 'perms', p] as const,
	featured: () => ['admin', 'featured'] as const,
	content: (page: string, locale: string) => ['admin', 'content', page, locale] as const,
	contentCombined: (page: string) => ['admin', 'content', page] as const
} as const;
