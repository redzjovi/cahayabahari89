import type { Context } from 'hono';
import type { Env } from '../http/middleware';
import { fail } from '../http/response';

/** Public image serving (same origin). Used when IMAGES_URL is unset (local dev),
 * so uploads are viewable without a custom image domain. R2 keys are UUID-unique
 * per upload, so immutable long caching is safe (replaced images get new URLs). */
export async function serve(c: Context<Env>) {
	const key = (c.req.param('key') as string);
	if ((!key.startsWith('products/') && !key.startsWith('cms/')) || key.includes('..')) return fail(c, 404, 'not found');
	const obj = await c.env.IMAGES.get(key);
	if (!obj) return fail(c, 404, 'not found');
	const headers = new Headers();
	headers.set('content-type', obj.httpMetadata?.contentType ?? 'application/octet-stream');
	headers.set('cache-control', 'public, max-age=31536000, immutable');
	if (obj.httpEtag) headers.set('etag', obj.httpEtag);
	return new Response(obj.body, { headers });
}
