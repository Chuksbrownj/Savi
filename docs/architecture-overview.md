# Architecture Overview

## Overview
Savi is a comprehensive Laundry Management Platform designed to serve multiple actors:
1. **Customers**: Requesting laundry services, tracking orders.
2. **Business Operators**: Managing laundry operations, assigning drivers, processing orders.
3. **Dispatch Riders**: Picking up and delivering laundry.
4. **Admins**: Platform oversight, analytics, billing.

## Tech Stack
- **Backend Framework**: NestJS (deployed as a Vercel Serverless Function).
- **Monorepo Management**: Nx (used to manage multiple apps and shared libraries).
- **Database**: PostgreSQL (hosted on Supabase).
- **ORM**: Prisma ORM.
- **Background Jobs / Queues**: Upstash QStash (Serverless webhook-based message queue for processing emails, analytics, and delayed jobs).
- **Caching**: Upstash Redis (Serverless Redis for OTPs, caching, and rate limiting).
- **Analytics**: PostHog.
- **Email Delivery**: Brevo.
- **Frontend Clients**: Flutter (for Web, iOS, Android).
- **Payments**: Paystack (Integration stubbed/designed).

## Key Architectural Decisions

1. **Serverless-First Backend**
   To remain within free-tier limits and scale seamlessly without managing VMs, the backend is designed around serverless paradigms. The NestJS application is bundled as a single serverless function via Vercel. 
   
2. **Webhook-Based Async Processing**
   Instead of using long-running workers (which Vercel does not support natively), all background jobs (e.g., email sending, report generation, order auto-completion) use Upstash QStash. QStash handles retries and scheduling, calling securely signed `/api/webhooks/qstash` endpoints on our API.

3. **Domain-Driven Design (DDD)**
   The codebase follows modular, domain-driven structure:
   - `identity`: User management, Auth, JWTs, Roles.
   - `orders`: Order lifecycle, calculation, state machine.
   - `business`: Business onboarding, dispatch assignment, analytics.
   - `notifications`: Email, SMS, Push notification dispatch.
   - `payments`: Transactions, ledger, integrations.

4. **Security**
   - JWT-based authentication with Access and Refresh tokens.
   - Role-Based Access Control (RBAC) via `@Roles` decorators.
   - QStash webhook signature verification.
