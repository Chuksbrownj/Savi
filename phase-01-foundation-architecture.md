# Phase 1 — Foundation & Architecture Setup

## Goal
Establish the production-grade project skeleton for the Laundry Management
Platform backend using Clean Architecture and Domain-Driven Design (DDD),
with all tooling, linting, environment config, and CI wired up — before any
business logic is written.

## Context
This is a multi-role platform (Customer, Business Operator, Dispatch
Rider) sharing **one backend and one database**. The backend must be
modular enough that each role's API surface can evolve independently while
sharing core domain logic (Orders, Payments, Users).

## Build Prompt

```
You are setting up the foundation for a production-ready Laundry
Management Platform backend. Do the following:

1. PROJECT INIT
   - Initialize a NestJS (TypeScript) monorepo using Nx or native Nest
     workspaces (choose Nx if we anticipate multiple deployable apps,
     e.g. api + worker + admin-bff).
   - Node LTS version, strict TypeScript config (`strict: true`,
     `noImplicitAny`, `strictNullChecks`).
   - Set up ESLint + Prettier with a shared config, and Husky +
     lint-staged pre-commit hooks (lint, format, type-check).

2. CLEAN ARCHITECTURE / DDD LAYOUT
   Structure the codebase into these layers per bounded context/module:
     - `domain/` — entities, value objects, domain events, repository
       interfaces (no framework dependencies)
     - `application/` — use cases / services, DTOs, command & query
       handlers (CQRS-lite: commands mutate, queries read)
     - `infrastructure/` — ORM implementations of repositories, external
       service adapters (payment gateways, SMS, email, maps, storage)
     - `interface/` (or `presentation/`) — REST controllers, guards,
       pipes, request/response DTOs, versioned under `/api/v1`

   Create top-level bounded-context modules (empty scaffolds for now,
   to be filled in later phases):
     - `identity` (users, auth, roles, permissions)
     - `catalog` (laundry services, pricing)
     - `orders` (order, order item, status workflow)
     - `dispatch` (dispatch rider, assignment, proof of delivery)
     - `payments` (payment, settlement)
     - `notifications`
     - `business` (business, branch, staff)
     - `support` (support tickets, ratings)
     - `shared-kernel` (common value objects: Money, Address, PhoneNumber,
       AuditLog, Pagination, Result/Either type)

3. CONFIGURATION MANAGEMENT
   - Use `@nestjs/config` with schema validation (Joi or Zod) for all env
     vars. Fail fast on boot if required env vars are missing.
   - Separate `.env.example`, `.env.development`, `.env.test`,
     `.env.production` templates.
   - Config namespaces: `database`, `redis`, `jwt`, `storage`, `payments`,
     `notifications`, `maps`, `throttler`.

4. DATABASE & ORM DECISION
   - Choose Prisma as the ORM (document the decision in
     `/docs/adr/0001-orm-choice.md` as an Architecture Decision Record,
     including why Prisma was chosen over TypeORM: type safety, migration
     ergonomics).
   - Wire up PostgreSQL connection via Docker Compose for local dev.
   - Do NOT define the full schema yet — that's Phase 2. Just get the
     Prisma client bootstrapped and a health-check query working.

5. REDIS & QUEUES
   - Wire up Redis via `@nestjs/bullmq` for background job processing
     (notifications, settlement batch jobs, etc. — to be used in later
     phases). Confirm connection with a health check.

6. CROSS-CUTTING CONCERNS (scaffolds only, to be filled in Phase 3)
   - Global exception filter returning a consistent error envelope:
     `{ statusCode, error, message, path, timestamp, requestId }`
   - Global validation pipe (class-validator + class-transformer,
     whitelist + forbidNonWhitelisted).
   - Request ID middleware (correlation ID per request, propagated to
     logs).
   - Structured logging with Pino (JSON logs in production, pretty in
     dev), including request/response logging middleware.
   - Global response interceptor for consistent success envelope:
     `{ data, meta }`.

7. API VERSIONING & DOCS
   - URI versioning: `/api/v1/...`
   - Set up Swagger/OpenAPI at `/api/docs`, auto-generated from
     controllers and DTOs. Tag endpoints by module (Customer, Business,
     Dispatch, Admin).

8. HEALTH & OBSERVABILITY
   - `/health` endpoint (Terminus) checking DB, Redis, and disk.
   - `/metrics` stub for future Prometheus integration.

9. TESTING SCAFFOLD
   - Jest configured for unit tests (per module) and e2e tests
     (Supertest against a test DB via Docker).
   - Add a sample unit test and a sample e2e test that hits `/health`,
     to prove the pipeline works.

10. CI PIPELINE
    - GitHub Actions workflow: install → lint → type-check → unit test →
      e2e test → build. Run on every PR.
    - Cache node_modules/pnpm store for speed.

11. DOCUMENTATION
    - `README.md` with setup instructions, architecture diagram
      (ASCII or Mermaid), and module map.
    - `/docs/adr/` folder for architecture decision records, starting
      with ORM choice and monorepo tooling choice.

Deliver a working, bootable NestJS application with empty but correctly
structured modules, a passing CI pipeline, and Swagger docs reachable
locally. Do not implement any business logic yet — this phase is
infrastructure only.
```

## Definition of Done
- [ ] `docker-compose up` brings up Postgres + Redis + API
- [ ] `/health` returns 200 with DB and Redis checks passing
- [ ] `/api/docs` (Swagger) loads
- [ ] CI pipeline green on a fresh PR
- [ ] Module folders exist for all 9 bounded contexts with empty
      domain/application/infrastructure/interface subfolders
- [ ] ADRs committed for ORM and monorepo tooling choices
- [ ] Lint, format, and type-check all pass with zero errors

Proceed to `phase-02-database-schema.md`.
