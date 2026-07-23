# Savi - Dry Cleaning & Laundry Management Platform

Savi is a comprehensive, multi-platform solution designed to digitize and streamline dry cleaning and laundry operations. The platform connects businesses, customers, and dispatch riders through dedicated interfaces, all powered by a robust and highly scalable backend infrastructure.

## 🏗 System Architecture

The project operates as a monorepo containing a centralized backend API and multiple dedicated frontend applications:

### 1. Backend API (NestJS)

A highly scalable RESTful API built with NestJS, serving as the central nervous system for all client applications.

- **Framework:** NestJS (TypeScript)
- **Database:** PostgreSQL (via [Supabase](https://supabase.com))
- **ORM:** Prisma
- **Caching & Rate Limiting:** Redis (via [Upstash](https://upstash.com))
- **Authentication:** Custom JWT-based Auth
- **AI Features:** Google Gemini Integration

### 2. Frontend Applications (Flutter)

The user-facing platforms are built with Flutter, allowing seamless deployment to Web, iOS, and Android from a single codebase.

- **Business Web (`apps/business_web`):** A management dashboard for laundry business owners to track orders, manage customers, and monitor revenue.
- **Customer App (`apps/customer`):** The primary app for end-users to schedule pickups, track laundry status, and make payments.
- **Dispatch App (`apps/dispatch`):** A dedicated interface for riders to manage delivery routes and pickup schedules.

---

## 🛠 Tech Stack & Integrations

Savi relies on a modern stack of third-party services to handle various operations efficiently (see `.env.example` for configuration variables):

- **Database:** Supabase (PostgreSQL with transaction pooling)
- **Caching:** Upstash Serverless Redis
- **Analytics:** PostHog
- **Storage:** Cloudflare R2 / Supabase Storage / Cloudinary (S3-compatible bucket for media uploads)
- **Payments:** Paystack, Flutterwave, Stripe
- **Notifications:** Firebase Cloud Messaging (FCM), Brevo (Email), Termii (SMS)
- **Location Services:** Google Maps API

---

## 🚀 Local Development Setup

### Prerequisites

- Node.js (v18 or higher)
- pnpm (recommended) or npm/yarn
- Flutter SDK (for running the frontend apps)

### 1. Backend Setup

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Environment Configuration:**
   Copy the example environment file and fill in your development keys. (No sensitive keys should ever be committed to version control).

   ```bash
   cp .env.example .env
   ```

   _Note: Ensure you have your PostgreSQL URL, Redis credentials, and a secure `JWT_SECRET` configured._

3. **Database Setup (Prisma):**
   Push the schema to your development database:

   ```bash
   npx prisma db push
   # or run migrations if applicable: npx prisma migrate dev
   ```

4. **Start the API server:**
   ```bash
   pnpm run start:dev
   ```

### 2. Frontend Setup (Example: Business Web)

1. **Navigate to the app directory:**

   ```bash
   cd apps/business_web
   ```

2. **Install Flutter dependencies:**

   ```bash
   flutter pub get
   ```

3. **Run the app locally:**
   ```bash
   flutter run -d chrome
   ```

---

## ☁️ Deployment Summary

The project is structured for easy deployment on modern serverless infrastructure:

- **Backend API:** Optimized for [Vercel](https://vercel.com). Deploy by linking the repository and securely setting your environment variables.
- **Frontend (Web):** The Flutter web apps are optimized for deployment on Firebase Hosting, Cloudflare Pages, or Vercel via custom build scripts.

---

## 🔒 Security Policy

- **Never commit `.env` files or expose sensitive API keys in the repository.**
- All third-party secrets, keys, and tokens must be managed securely through the environment variables of your hosting provider.
