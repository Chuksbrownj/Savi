# Deployment Guide

The Savi platform is designed as a Next.js monorepo and is optimized for deployment on Vercel and Supabase.

## 1. Database (Supabase)
We are using Supabase as our PostgreSQL provider.
1. Create a new Supabase project.
2. Under **Project Settings > Database**, copy the **Connection string (URI)**.
3. Replace the `[YOUR-PASSWORD]` placeholder with your actual database password.
4. From your local repository, run migrations:
   ```bash
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres" npx prisma db push
   ```

## 2. Next.js Apps (Vercel)
The platform consists of 4 separate Next.js applications in the `apps/` directory. You will deploy each one as a separate Project in Vercel, pointing to the same GitHub repository.

### For each app (`api`, `business_web`, `customer`, `dispatch`):
1. Go to your Vercel Dashboard and click **Add New... > Project**.
2. Import your GitHub repository.
3. In the **Configure Project** screen, expand the **Root Directory** section and click **Edit**.
4. Select the corresponding app directory (e.g., `apps/business_web`).
5. **Framework Preset** should automatically detect as **Next.js**.
6. **Build Command** should automatically detect as `next build`.
7. Expand **Environment Variables** and add the required variables (e.g., `DATABASE_URL` for `api`).
8. Click **Deploy**.

## 3. Environment Variables

### `apps/api`
- `DATABASE_URL`: Your Supabase connection string.
- `JWT_SECRET`: A secure random string for signing JWTs.
- `NODE_ENV`: `production`

### Frontend Apps (`business_web`, `customer`, `dispatch`)
- `NEXT_PUBLIC_API_URL`: The deployed URL of your `apps/api` Vercel project (e.g., `https://savi-api.vercel.app`).
