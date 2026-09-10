import type { Bindings } from '../auth';

/** Build the public URL for an R2 key. Falls back to the same-origin serving
 * route when IMAGES_URL is unset (local dev), so uploads are viewable everywhere. */
export function imageUrl(env: Bindings, r2Key: string): string {
	const base = (env.IMAGES_URL ?? '').replace(/\/+$/, '');
	return base ? `${base}/${r2Key}` : `/api/images/${r2Key}`;
}
