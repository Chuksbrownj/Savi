# Phase 10 — Reports, Analytics & Admin Dashboard Backend

## Goal

Give Business Operators (and a platform SuperAdmin) the reporting,
analytics, and audit visibility the PRD calls for, built as read-optimized
endpoints separate from the transactional API so they don't compete with
or slow down order-critical paths.

## Build Prompt

```
Implement the `analytics`/reporting slice of the `business` module
(plus a lightweight `admin` module for platform-level oversight).
Requirements:

1. READ-MODEL STRATEGY
   - Decide and document (ADR) whether to query Postgres directly with
     optimized aggregate queries/materialized views, or stand up a
     denormalized reporting schema updated via domain events. For this
     platform's scale, recommend: materialized views refreshed on a
     schedule (every 5-15 min) for heavy aggregates, plus direct
     indexed queries for anything needing near-real-time data (today's
     order count). Document the trade-off explicitly.
   - Ensure none of these queries run against the primary transactional
     connection pool without safeguards (use a read replica if
     available, or a separate connection pool with a lower max size
     and statement timeout, to protect order-taking traffic).

2. BUSINESS DASHBOARD ENDPOINTS
   - `GET /business/dashboard/summary` — today/this-week/this-month
     toggle: total orders, revenue, average order value, active orders
     by status (counts), completed vs cancelled rate.
   - `GET /business/dashboard/orders-trend` — time-series order count
     and revenue, groupable by day/week/month, filterable by branch.
   - `GET /business/dashboard/service-breakdown` — revenue/order count
     by LaundryService type, to identify top-performing services.
   - `GET /business/dashboard/rider-performance` — per-rider: completed
     jobs, average rating, on-time rate (compare `completedAt` vs an
     expected SLA window if defined), rejection rate.
   - `GET /business/dashboard/branch-performance` — per-branch order
     volume, revenue, average turnaround time (pickup → delivered).
   - `GET /business/dashboard/customer-insights` — repeat customer
     rate, top customers by lifetime value, new vs returning split.

3. REPORTS (EXPORTABLE)
   - `GET /business/reports/orders?format=csv|xlsx` — full order export
     with filters (date range, status, branch), streamed generation for
     large datasets (don't load everything into memory — use a
     streaming CSV writer or paginated XLSX builder).
   - `GET /business/reports/settlements?format=csv` — settlement/payout
     history for accounting reconciliation.
   - `GET /business/reports/revenue?format=pdf` — a formatted
     summary report suitable for sharing with stakeholders (basic
     template is fine — logo, date range, key metrics table).
   - All exports run as a background job (BullMQ) for large date
     ranges, with the API returning a job ID and a
     `GET /business/reports/:jobId/status` polling endpoint, then a
     download URL (presigned S3, from Phase 3) once ready — avoid
     synchronous multi-second HTTP requests for big exports.

4. AUDIT LOG VISIBILITY
   - `GET /business/audit-logs` — scoped to actions within this
     business (staff/rider actions, order/payment changes), filterable
     by actor, action type, date range, entity. Read-only, paginated,
     permission-gated (`audit:view`, typically restricted to
     BusinessOwner/senior staff roles only).

5. PLATFORM ADMIN MODULE (SuperAdmin role)
   - `GET /admin/businesses` — list/search all businesses on the
     platform, view activity/health (order volume, last active).
   - `POST /admin/businesses/:id/suspend` / `/reactivate` — platform-
     level enforcement (e.g. ToS violations, non-payment of platform
     fees if applicable).
   - `GET /admin/audit-logs` — platform-wide audit trail, unscoped.
   - `GET /admin/system-health` — aggregate metrics (total businesses,
     total orders processed, gateway error rates from Phase 8's
     reconciliation, notification delivery failure rates from Phase 9).
   - These endpoints require a distinct `Admin` userType (from Phase 2
     enum) — never grantable via the normal business staff-invite flow;
     seed the first SuperAdmin manually via a secure CLI script, not an
     API endpoint.

6. CACHING
   - Cache dashboard summary responses in Redis with a short TTL
     (e.g. 60s) keyed by businessId + date range, to protect against
     dashboard-refresh hammering.

7. TESTING
   - Unit tests for each aggregate calculation (revenue sums, average
     order value, turnaround time) against seeded fixture data with
     known expected outputs.
   - E2E test for the async export flow: trigger export → poll status
     → download → verify CSV/XLSX content matches the filtered order
     set.
   - Test that a Business's dashboard/report endpoints never leak
     another business's data (reuse the multi-tenancy test pattern
     from Phase 5).
   - Test that non-SuperAdmin roles get 403 on all `/admin/*` routes.

Output: complete reporting/analytics endpoints under `/business/
dashboard/*` and `/business/reports/*`, the `admin` module, the ADR on
read-model strategy, and the test suite above.
```

## Definition of Done

- [ ] Dashboard summary and trend endpoints return correct aggregates
      against seeded data
- [ ] Large exports run asynchronously via job queue, never block the
      request thread
- [ ] Reporting queries don't degrade transactional API performance
      (documented safeguard in place: replica, pool limits, or
      statement timeout)
- [ ] Admin module fully isolated to SuperAdmin, first admin seeded via
      CLI not API
- [ ] Multi-tenancy isolation verified on all reporting endpoints

Proceed to `phase-11-frontend-apps.md`.
