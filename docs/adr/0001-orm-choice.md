# ADR-0001: ORM Choice — Prisma over TypeORM

**Date**: 2026-07-12  
**Status**: Accepted  
**Deciders**: Platform architecture team  

---

## Context

The Laundry Management Platform requires a production-grade ORM for PostgreSQL with:
- Strong TypeScript type safety
- Reliable migration tooling
- Good developer experience for a team using DDD/Clean Architecture
- Active community and long-term support

The two primary candidates evaluated were **Prisma** and **TypeORM**.

---

## Decision

We will use **Prisma** as the ORM for all database interactions.

---

## Rationale

### Why Prisma

| Factor | Prisma | TypeORM |
|--------|--------|---------|
| **Type safety** | Excellent — generated client is fully typed from schema | Partial — decorator-based, type gaps at runtime |
| **Migration ergonomics** | `prisma migrate dev` / `prisma migrate deploy` — reliable, diff-based | Can silently drop columns; `synchronize: true` is dangerous in prod |
| **Schema as single source of truth** | `schema.prisma` defines all models; client is auto-generated | Entities and migrations can drift |
| **Query builder** | Prisma Client — expressive, fully typed | Query Builder is verbose; complex joins are error-prone |
| **Performance** | Optimized query engine (Rust-based) | Generally good but varies |
| **Community** | Very active, well-funded, fast release cadence | Mature but slower development |
| **DDD compatibility** | Repository pattern fits cleanly — Prisma stays in the infra layer | Works but ActiveRecord pattern can bleed into domain |

### Why NOT TypeORM

1. **Silent schema sync**: `synchronize: true` can drop columns in production — a critical risk for a payments platform.
2. **Type gaps**: The decorator-based entity definitions have known type inference gaps in complex relations.
3. **Migration reliability**: Multiple known issues with migration generation for complex schemas.

---

## Consequences

### Positive
- Full end-to-end type safety from database to API response
- Fast, safe migrations via `prisma migrate`
- Clean separation: Prisma Client only lives in the `infrastructure/` layer
- Excellent introspection tooling (`prisma studio`)

### Negative / Trade-offs
- Prisma Client must be regenerated after schema changes (`pnpm prisma generate`)
- Raw SQL still required for advanced PostgreSQL features (e.g., `JSONB` operators, custom aggregates)
- Prisma is not "true" DDD — we wrap it behind repository interfaces in the domain layer

---

## Alternatives Considered

- **Drizzle ORM** — newer, lighter, but less mature ecosystem at decision time
- **Knex.js** — query builder only, no schema management
- **Raw SQL (pg)** — too verbose for 20+ entities with complex relations
