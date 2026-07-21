# ADR 003: Read-Model Strategy for Analytics and Reports

## Context
Phase 10 introduces the requirement for reporting and analytics dashboards for Business Operators and platform SuperAdmins. These endpoints require complex aggregations (e.g., total orders, revenue, active order counts, and historical trends). 
Running these aggregations on the primary transactional database without safeguards could lead to connection pool exhaustion and slow down critical order-taking paths. 
We need to decide on a read-model strategy that balances performance, scalability, and implementation overhead.

## Options Considered
1. **Fully Denormalized Read-Model / CQRS:** Create a separate reporting schema populated asynchronously via domain events.
   - *Pros:* Ultimate performance, perfectly tailored schemas for queries, zero impact on the primary database.
   - *Cons:* Extremely high implementation complexity, requires maintaining event consumers, high infrastructure cost for small-to-moderate scale.
2. **PostgreSQL Materialized Views:** Create materialized views for heavy aggregates and refresh them on a schedule (e.g., every 5-15 mins).
   - *Pros:* Excellent read performance for heavy queries, native to Postgres.
   - *Cons:* Prisma does not natively support materialized views. Maintaining schema migrations for them with raw SQL adds overhead. Still puts load on the primary DB during refresh unless a read replica is used.
3. **Prisma Aggregates + Redis Caching:** Use Prisma's native `.groupBy` and `.aggregate` methods on the primary connection, but cache the results heavily in Redis (e.g., 60-second TTL). Configure Prisma to use a read-replica connection pool if available.
   - *Pros:* Low implementation complexity, utilizes existing Prisma schema, "good enough" for near-real-time requirements at moderate scale.
   - *Cons:* First-load query (cache miss) still hits the primary DB unless a read replica is specifically configured.

## Decision
We will proceed with **Option 3: Prisma Aggregates + Redis Caching**. 

Given the current moderate scale of the platform, the overhead of maintaining a fully denormalized schema or raw SQL materialized views is not justified. 
By employing a robust caching strategy (e.g., caching dashboard summaries for 60 seconds), we can significantly reduce the load on the database. 

To safeguard the primary transactional pool, we will document that in production environments, the `DATABASE_URL` used by the analytics/reporting endpoints should ideally point to a PostgreSQL Read Replica, or utilize `@prisma/extension-read-replicas` in the Prisma Client configuration once load necessitates it.

## Consequences
- Dashboard endpoints must wrap their Prisma queries in caching logic (e.g., using NestJS `CacheManager`).
- Analytics data will be eventually consistent up to the cache TTL (60s).
- Background report exports (CSV, PDF) will use a separate job queue (BullMQ) to prevent blocking the HTTP thread pool.
