import type { Context } from 'hono';

/** Laravel-inspired JSON envelope: { data } / { data, meta } / { message } / { message, errors }. */

export type ApiMeta = { page: number; limit: number; total: number };

export type ApiSingle<T> = { data: T; message?: string };
export type ApiList<T> = { data: T[]; meta: ApiMeta };
export type ApiMessage = { message: string; data?: unknown };
export type ApiError = { message: string; errors?: Record<string, string[]>; [k: string]: unknown };

export function ok<T>(c: Context, data: T, message?: string, status = 200) {
	return c.json(message ? { data, message } : ({ data } as ApiSingle<T>), status as never);
}

export function created<T>(c: Context, data: T, message = 'Created') {
	return c.json({ data, message } as ApiSingle<T>, 201 as never);
}

export function paginated<T>(c: Context, items: T[], page: number, limit: number, total: number) {
	return c.json({ data: items, meta: { page, limit, total } } as ApiList<T>);
}

export function withMessage(c: Context, message: string, status = 200, data?: unknown) {
	return c.json(data === undefined ? { message } : { message, data }, status as never);
}

export function fail(c: Context, status: number, message: string, extra?: Record<string, unknown>) {
	return c.json({ message, ...extra } as ApiError, status as never);
}

/**
 * zValidator hook: normalize all validation failures to Laravel-style
 * 422 { message: 'Validation failed', errors: { field: [...] } }.
 * Usage: zValidator('json', schema, validationHook)
 */
export function validationHook(result: { success: boolean; error?: unknown }, c: Context) {
	if (result.success) return undefined;
	const errors: Record<string, string[]> = {};
	const issues = (result.error as { issues?: { path: (string | number)[]; message: string }[] })?.issues ?? [];
	for (const issue of issues) {
		const key = issue.path.length ? issue.path.join('.') : '_';
		(errors[key] ??= []).push(issue.message);
	}
	return c.json({ message: 'Validation failed', errors } satisfies ApiError, 422 as never);
}
