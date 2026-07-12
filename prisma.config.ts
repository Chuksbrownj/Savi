import { defineConfig } from 'prisma/config';

/**
 * Prisma v7 configuration file.
 * Connection URL is now configured here instead of in schema.prisma.
 * The DATABASE_URL env var is loaded by NestJS ConfigModule at runtime.
 */
export default defineConfig({
  datasourceUrl: process.env['DATABASE_URL'] ?? 'postgresql://savi_user:savi_password@localhost:5432/savi_dev',
});
