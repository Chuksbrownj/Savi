import { defineConfig } from 'prisma/config';

/**
 * Prisma v7 configuration file.
 *
 * This file configures the Prisma CLI tooling (migrate, generate, studio, etc.).
 * It does NOT configure the runtime PrismaClient — that is done in PrismaService
 * via the Driver Adapter (@prisma/adapter-pg).
 *
 * The datasourceUrl here is used by:
 *   - prisma migrate deploy / dev
 *   - prisma db push / pull
 *   - prisma studio
 *
 * The DATABASE_URL env var is provided:
 *   - Locally: via .env.development
 *   - CI/CD: via secrets
 */
export default defineConfig({
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://savi_user:savi_password@localhost:5432/savi_dev',
  },
});
