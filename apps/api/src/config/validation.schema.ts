import { ConfigModuleOptions } from '@nestjs/config';
import { z } from 'zod';

/**
 * Zod schema for environment variable validation.
 * The application will fail fast on boot if any required variable is missing
 * or invalid.
 */
export const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Storage (AWS S3 / Cloudinary)
  STORAGE_PROVIDER: z.enum(['s3', 'cloudinary']).default('s3'),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // Payments
  PAYSTACK_SECRET_KEY: z.string().optional(),
  FLUTTERWAVE_SECRET_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),

  // Notifications
  FCM_PROJECT_ID: z.string().optional(),
  FCM_CLIENT_EMAIL: z.string().optional(),
  FCM_PRIVATE_KEY: z.string().optional(),
  SENDGRID_API_KEY: z.string().optional(),
  TERMII_API_KEY: z.string().optional(),

  // Maps
  GOOGLE_MAPS_API_KEY: z.string().optional(),

  // Rate limiting
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(100),
});

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Config module options — validates env vars at boot using Zod.
 */
export const configModuleOptions: ConfigModuleOptions = {
  isGlobal: true,
  validate: (config: Record<string, unknown>) => {
    const result = envSchema.safeParse(config);
    if (!result.success) {
      const formatted = result.error.errors
        .map((e) => `  [${e.path.join('.')}] ${e.message}`)
        .join('\n');
      throw new Error(
        `\n❌ Invalid environment variables:\n${formatted}\n`,
      );
    }
    return result.data;
  },
};
