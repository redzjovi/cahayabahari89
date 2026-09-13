import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
export type LoginInput = z.infer<typeof loginSchema>;

export const updateProfileSchema = z.object({ name: z.string().trim().min(2).max(100) });
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
	.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(8).max(200) })
	.refine((d) => d.currentPassword !== d.newPassword, { message: 'new password must differ', path: ['newPassword'] });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
