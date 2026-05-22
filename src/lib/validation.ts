import { z } from 'zod';
import { isSafeUrl } from './security';

// Password validation schema with strong requirements
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Username validation schema
export const usernameSchema = z.string()
  .min(3, 'Username must be at least 3 characters')
  .max(32, 'Username must not exceed 32 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Block validation schemas
export const blockCreateSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(100, 'Title must not exceed 100 characters')
    .transform(val => val.trim()),
  url: z.string()
    .min(1, 'URL is required')
    .max(2048, 'URL must not exceed 2048 characters')
    .url('Invalid URL format')
    .transform(val => val.trim())
    .refine(val => isSafeUrl(val), {
      message: 'URL is not allowed for security reasons'
    }),
  description: z.string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
  icon: z.string()
    .max(255, 'Icon must not exceed 255 characters')
    .optional()
    .transform(val => val?.trim() || undefined),
  categoryId: z.string()
    .min(1, 'Category ID is required')
    .cuid('Invalid category ID format'),
  sortOrder: z.number().int().default(0),
  serviceUrl: z.string()
    .max(2048, 'Service URL must not exceed 2048 characters')
    .optional()
    .nullable()
    .transform(val => {
      if (!val || val.trim() === '') return null;
      return val.trim();
    })
    .refine(val => val === null || val === undefined || /^https?:\/\/.+/.test(val), {
      message: 'Invalid service URL format'
    })
    .refine(val => val === null || val === undefined || isSafeUrl(val), {
      message: 'Service URL is not allowed for security reasons'
    }),
  serviceType: z.string()
    .max(50, 'Service type must not exceed 50 characters')
    .optional()
    .nullable()
    .transform(val => val?.trim() || null),
  healthCheckUrl: z.string()
    .max(2048, 'Health check URL must not exceed 2048 characters')
    .optional()
    .nullable()
    .transform(val => {
      if (!val || val.trim() === '') return null;
      return val.trim();
    })
    .refine(val => val === null || val === undefined || /^https?:\/\/.+/.test(val), {
      message: 'Invalid health check URL format'
    })
    .refine(val => val === null || val === undefined || isSafeUrl(val), {
      message: 'Health check URL is not allowed for security reasons'
    }),
  isMonitored: z.boolean().default(false),
});

export const blockUpdateSchema = blockCreateSchema.partial().extend({
  id: z.string().cuid('Invalid block ID format'),
});

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(100, 'Name must not exceed 100 characters')
    .transform(val => val.trim()),
  icon: z.string()
    .max(100, 'Icon must not exceed 100 characters')
    .default('default')
    .transform(val => val.trim()),
  sortOrder: z.number().int().default(0),
});

export const categoryUpdateSchema = categoryCreateSchema.partial().extend({
  id: z.string().cuid('Invalid category ID format'),
});

// Settings validation schema
export const settingsUpdateSchema = z.object({
  dashboardProtected: z.boolean().optional(),
  dashboardPassword: z.string()
    .min(4, 'Password must be at least 4 characters')
    .max(128, 'Password must not exceed 128 characters')
    .optional()
    .nullable(),
  sessionDurationHours: z.number().int().min(1).max(8760, 'Session duration cannot exceed 12 months').optional(), // Max 12 months (365 * 24)
  weatherEnabled: z.boolean().optional(),
  weatherLatitude: z.number().min(-90).max(90).optional().nullable(),
  weatherLongitude: z.number().min(-180).max(180).optional().nullable(),
  weatherLocationName: z.string().max(100).optional().nullable(),
  weatherUnits: z.enum(['metric', 'imperial']).optional(),
  defaultView: z.enum(['comfortable', 'compact', 'dense', 'list']).optional(),
});

// Weather API params validation
export const weatherParamsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lon: z.coerce.number().min(-180).max(180),
});

// TOTP verification schema
export const totpVerifySchema = z.object({
  token: z.string()
    .length(6, 'TOTP token must be 6 digits')
    .regex(/^\d{6}$/, 'TOTP token must contain only digits'),
});

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required').max(128, 'Password must not exceed 128 characters'),
  totpToken: z.string()
    .length(6, 'TOTP token must be 6 digits')
    .regex(/^\d{6}$/, 'TOTP token must contain only digits')
    .optional()
    .or(z.literal('')), // Allow empty string as well
});

// Setup schema
export const setupSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  confirmPassword: z.string().max(128, 'Password must not exceed 128 characters'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Password change schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(128, 'Password must not exceed 128 characters'),
  newPassword: passwordSchema,
  confirmNewPassword: z.string().max(128, 'Password must not exceed 128 characters'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: 'New passwords do not match',
  path: ['confirmNewPassword'],
});

// Type exports
export type BlockCreateInput = z.infer<typeof blockCreateSchema>;
export type BlockUpdateInput = z.infer<typeof blockUpdateSchema>;
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type SetupInput = z.infer<typeof setupSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
