import type { Context } from 'hono';
import type { Env } from '../../http/middleware';
import { created, fail, withMessage } from '../../http/response';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES, extFor } from '../../requests/image';
import { imageUrl } from '../../services/products';

const PAGES = ['home', 'about', 'contact', 'site'] as const;

function safeKey(page: string, key: string): string | null {
	if (!(PAGES as readonly string[]).includes(page)) return null;
	if (!/^[a-z0-9._-]{1,120}$/i.test(key)) return null;
	return `cms/${page}/${key}`;
}

/** Admin: upload a CMS content image (multipart: page + key + file, RBAC: content.manage).
 * Returns { url } — the caller stores it into page_sections.image_url via PUT. */
export async function uploadContentImage(c: Context<Env>) {
	const form = await c.req.formData().catch(() => null);
	if (!form) return fail(c, 400, 'expected multipart form');
	const page = String(form.get('page') ?? '');
	const key = String(form.get('key') ?? '');
	const prefix = safeKey(page, key);
	if (!prefix) return fail(c, 400, 'page and key are required');
	const f = form.get('file');
	if (!(f instanceof File)) return fail(c, 400, 'file is required');
	if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
		return fail(c, 400, `unsupported type ${f.type || 'unknown'} (jpeg/png/webp/avif only)`);
	}
	if (f.size > MAX_IMAGE_BYTES) return fail(c, 400, `${f.name} exceeds 5 MB`);
	const r2Key = `${prefix}/${crypto.randomUUID()}.${extFor(f.type)}`;
	try {
		await c.env.IMAGES.put(r2Key, f, {
			httpMetadata: { contentType: f.type },
			customMetadata: { page, key }
		});
	} catch (e) {
		console.error('[cms-images] upload failed:', e);
		return fail(c, 500, 'upload failed');
	}
	return created(c, { url: imageUrl(c.env, r2Key), r2Key }, 'Image uploaded');
}

/** Admin: delete a CMS image R2 object by key (RBAC: content.manage).
 * Best-effort: the page_sections.image_url field is cleared by the caller's PUT. */
export async function deleteContentImage(c: Context<Env>) {
	const r2Key = c.req.query('key') ?? '';
	if (!r2Key.startsWith('cms/') || r2Key.includes('..')) return fail(c, 400, 'invalid key');
	try {
		await c.env.IMAGES.delete(r2Key);
	} catch (e) {
		console.error('[cms-images] delete failed:', e);
		return fail(c, 500, 'delete failed');
	}
	return withMessage(c, 'Image deleted');
}
