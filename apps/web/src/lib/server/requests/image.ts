import { z } from 'zod';

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function extFor(type: string): string {
	if (type === 'image/png') return 'png';
	if (type === 'image/webp') return 'webp';
	if (type === 'image/avif') return 'avif';
	return 'jpg';
}

export const reorderImagesSchema = z.object({
	slug: z.string().min(1),
	orderedIds: z.array(z.number().int().positive()).min(1).max(100)
});
