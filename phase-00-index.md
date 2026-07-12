# Laundry Management Platform — Build Phases Index

This is a 12-phase build plan derived from the Laundry Management Platform
PRD. Each phase is a **self-contained build prompt** — paste one file at a
time into your AI coding agent (Claude Code, Cursor, etc.) or hand it to a
dev, in order. Each phase assumes all prior phases are complete.

## How to use these files

1. Work through phases **in order** (00 → 11). Do not skip ahead — later
   phases assume the schema, auth, and module structure from earlier ones.
2. At the start of each phase, paste the **entire file** as your prompt.
3. At the end of each phase, verify the "Definition of Done" checklist
   before moving to the next file.
4. Each phase prompt is written to be run against the *same* codebase/repo
   — nothing is thrown away between phases.

## Phase Map

| Phase | File | Focus |
|-------|------|-------|
| 1 | `phase-01-foundation-architecture.md` | Repo setup, Clean Architecture/DDD skeleton, tooling, CI |
| 2 | `phase-02-database-schema.md` | PostgreSQL schema, all 20 entities, migrations, seeders |
| 3 | `phase-03-auth-rbac-security.md` | JWT auth, refresh tokens, OTP, RBAC, rate limiting |
| 4 | `phase-04-customer-module.md` | Customer-facing APIs: profile, addresses, services, orders |
| 5 | `phase-05-business-operator-module.md` | Order approval, pricing, branches, staff, customer mgmt |
| 6 | `phase-06-dispatch-rider-module.md` | Rider assignment, accept/reject, pickup/delivery, POD |
| 7 | `phase-07-order-status-workflow-engine.md` | State machine for the 17-step order status flow |
| 8 | `phase-08-payments-settlements.md` | Paystack/Flutterwave/Stripe, payment rules, rider settlement |
| 9 | `phase-09-notifications.md` | FCM push, email, SMS, in-app notification center |
| 10 | `phase-10-reports-analytics-admin.md` | Dashboards, analytics, reporting, audit logs |
| 11 | `phase-11-frontend-apps.md` | Flutter Customer app, Flutter Dispatch app, Flutter Web Business dashboard |
| 12 | `phase-12-testing-devops-deployment.md` | Automated testing, Docker, CI/CD, deployment, docs |

## Non-negotiable Core Principles (apply to every phase)

- The **Business Operator controls every operation** — riders and
  customers never bypass the business.
- **Dispatch riders never initiate work** — no self-assignment, no job
  creation, no order edits.
- **Every pickup/delivery is business-initiated.**
- **Customers never manage riders directly.**
- **Customers pay the business only** — dispatch fees flow through the
  business; riders are settled separately by the business.
- Architecture must remain **Clean Architecture + DDD**, modular, with
  REST APIs, RBAC enforced at the API layer, and full audit logging on
  state-changing actions.

## Recommended Stack (fixed across all phases unless stated otherwise)

- Backend: **NestJS** (TypeScript), Clean Architecture + DDD module layout
- DB: **PostgreSQL** (with Prisma or TypeORM — Phase 1 will decide and lock this)
- Cache/Queue: **Redis** (BullMQ for jobs)
- Storage: **AWS S3** (or Cloudinary) for proof-of-delivery images, avatars
- Payments: **Paystack**, **Flutterwave**, **Stripe**
- Notifications: **Firebase Cloud Messaging**, **Email (SES/SendGrid)**, **SMS (Termii/Twilio)**
- Maps: **Google Maps API**
- Frontend: **Flutter** (Customer + Dispatch apps), **Flutter Web** (Business dashboard)
- Auth: **JWT + Refresh Tokens**, **RBAC**, **OTP verification**

Proceed to `phase-01-foundation-architecture.md`.
