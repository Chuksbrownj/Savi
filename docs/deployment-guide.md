# Deployment Guide

This guide covers deploying the Savi Backend and Web Apps to Vercel and configuring required integrations.

## Prerequisites

- **Vercel Account**
- **Supabase Account** (for PostgreSQL)
- **Upstash Account** (for Redis and QStash)
- **Brevo Account** (for Emails)
- **PostHog Account** (for Analytics)

## Environment Variables

Ensure the following secrets are added to your Vercel Project settings before deployment:

```env
# Database
DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...

# Upstash QStash
QSTASH_URL=https://qstash.upstash.io/v2/messages
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=...
QSTASH_NEXT_SIGNING_KEY=...

# Auth JWT
JWT_SECRET=your-secure-random-jwt-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Brevo Email
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=no-reply@savi-app.com
BREVO_SENDER_NAME=Savi

# Base URLs
API_BASE_URL=https://your-savi-api.vercel.app
WEB_URL=https://your-savi-web.vercel.app
```

## Deploying the Backend (NestJS + Vercel)

1. Connect your GitHub repository to Vercel.
2. In Vercel, create a new project and import the repository.
3. Configure the build settings for the Backend:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist/apps/api`
   - **Install Command**: `pnpm install`
4. The `vercel.json` file in the root directory will automatically route all `/api/*` traffic to the compiled serverless handler.
5. Deploy.

## Deploying Flutter Web Apps

For the Flutter Business Web Dashboard (`apps/business_web`):

1. Create another project in Vercel.
2. Point it to the same repository.
3. Set the **Root Directory** to `apps/business_web`.
4. Vercel will use the `vercel.json` within that folder to build the Flutter app:
   - **Build Command**: `flutter build web --release`
   - **Output Directory**: `build/web`
5. Deploy.

## Prisma Database Migrations

Vercel build pipelines typically do not run database migrations. You should run Prisma migrations via GitHub Actions (CI/CD) or manually from your local machine:

```bash
DATABASE_URL="your-production-db-url" pnpm exec prisma migrate deploy
```

## Verifying Webhooks (QStash)

After deploying the backend, ensure your API domain is set up in Upstash QStash. You can trigger test background jobs via QStash to verify that your API's `/api/v1/webhooks/qstash/...` endpoints successfully receive and process requests.
