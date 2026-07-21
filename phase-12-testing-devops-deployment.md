# Phase 12 — Testing, DevOps, Deployment & Documentation

## Goal

Harden the platform for production: comprehensive automated testing
coverage, containerization, CI/CD pipelines for all apps, infrastructure-
as-code, monitoring/alerting, security review, and complete
documentation — the final gate before launch.

## Build Prompt

```
Finalize the Laundry Management Platform for production readiness.
Requirements:

1. TEST COVERAGE AUDIT
   - Run coverage reports across the NestJS backend; target ≥80% line
     coverage on `domain` and `application` layers specifically
     (infrastructure/interface layers can be lower if covered by e2e).
   - Fill gaps identified: any use case without a unit test, any
     controller without at least one e2e happy-path + one auth-failure
     test.
   - Add contract tests between backend and frontend: validate the
     OpenAPI spec (Phase 1's Swagger output) against actual response
     shapes using a schema-diff tool in CI, so frontend/backend drift
     is caught automatically.
   - Add load tests (k6 or Artillery) for the top 5 highest-traffic
     endpoints (order creation, order tracking poll, dashboard summary,
     login, availability toggle) with target thresholds (e.g. p95 <
     300ms at expected concurrent load) — document baseline results.

2. CONTAINERIZATION
   - Production-grade multi-stage Dockerfile for the NestJS API
     (build stage → slim runtime stage, non-root user, health check
     directive).
   - Dockerfile for the BullMQ worker process (separate from the API
     process for independent scaling).
   - `docker-compose.prod.yml` reference (Postgres, Redis, API, worker,
     reverse proxy) for self-hosted deployments; note that managed
     services (RDS, ElastiCache) are recommended for actual production.

3. INFRASTRUCTURE AS CODE
   - Choose Terraform (recommended) or equivalent; define modules for:
     VPC/networking, managed Postgres, managed Redis, container
     hosting (ECS Fargate, or equivalent — choose based on team
     familiarity and document the ADR), S3 buckets with correct
     bucket policies (private, presigned-URL-only access), secrets
     management (AWS Secrets Manager or equivalent — no secrets in
     env files committed anywhere).
   - Separate environments: dev, staging, production, with isolated
     resources and separate gateway sandbox/live credentials.

4. CI/CD PIPELINES
   - Backend: lint → type-check → unit test → e2e test → build image →
     push to registry → deploy to staging automatically on merge to
     `main` → manual approval gate → deploy to production.
   - Frontend (each Flutter app): analyze → test → build (APK/AAB for
     Android, IPA for iOS via Codemagic/Fastlane or GitHub Actions +
     Fastlane, Web build for Business dashboard) → deploy web build to
     hosting (S3+CloudFront or Firebase Hosting) → app store/play store
     upload gated behind manual approval.
   - Database migrations run as a distinct CI/CD step before app
     deployment, with an automated rollback plan documented (not
     necessarily automated rollback execution, but a clear runbook).

5. MONITORING & ALERTING
   - Application Performance Monitoring (Sentry or Datadog) wired into
     the NestJS backend and all three Flutter apps for error tracking.
   - Structured log aggregation (the Pino JSON logs from Phase 1) into
     a log platform (CloudWatch Logs, Datadog, or ELK).
   - Alerts for: elevated 5xx rate, payment webhook failure rate spike
     (from Phase 8), notification delivery failure rate spike (Phase
     9), queue backlog depth (BullMQ), and the `/health` endpoint
     failing.
   - Uptime monitoring (external, e.g. a synthetic check hitting
     `/health` every minute from outside the infra).

6. SECURITY REVIEW
   - Run a dependency vulnerability scan (npm audit / Snyk / Dependabot
     enabled) and Flutter/Dart equivalent; fix or document accepted
     risk for any high/critical findings.
   - OWASP API Top 10 checklist review against the actual
     implementation (BOLA/object-level auth — re-verify Phase 5's
     multi-tenancy tests; mass assignment — confirm DTO whitelisting
     from Phase 3 covers every mutation endpoint; rate limiting —
     confirm Phase 3's limits are actually applied to every sensitive
     route, not just auth).
   - Verify secrets rotation process documented (JWT signing key
     rotation plan, gateway key rotation plan).
   - Confirm audit logging (Phase 3) captures every state-changing
     admin/business action, spot-checked against the full endpoint
     list.

7. PERFORMANCE & SCALABILITY REVIEW
   - Verify database indexes from Phase 2 actually get used (EXPLAIN
     ANALYZE on the top slow queries under realistic seeded volume,
     e.g. 100k orders).
   - Confirm Phase 10's reporting queries are isolated from the
     transactional pool as designed.
   - Document horizontal scaling plan for the API (stateless, so scales
     trivially behind a load balancer) and the BullMQ worker
     (independently scalable by queue).

8. DOCUMENTATION PACKAGE
   - `/docs/architecture-overview.md` — system diagram (Mermaid),
     module map, tech stack summary, links to all prior ADRs.
   - `/docs/api-reference.md` — pointer to the live Swagger/OpenAPI
     docs, plus a curated "getting started" set of example requests
     per role.
   - `/docs/runbooks/` — incident response runbooks: payment gateway
     outage, database failover, notification provider outage, mass
     rider reassignment procedure if a business's riders go offline
     simultaneously.
   - `/docs/deployment.md` — full environment setup, secrets required,
     migration procedure, rollback procedure.
   - `/docs/onboarding.md` — new-developer setup guide (clone → env →
     docker-compose up → seed → run tests, in one page).
   - Update the root `README.md` to link all of the above and give an
     accurate current-state project summary (not aspirational —
     reflect what's actually built).

9. FINAL ACCEPTANCE TEST
   - Execute one complete manual (or scripted) end-to-end scenario
     across real infrastructure (staging): customer registers, orders,
     pays, business approves and assigns pickup rider, rider picks up
     and drops at business, business processes through all stages,
     business assigns delivery rider, rider delivers with POD, customer
     confirms receipt and rates, business generates and processes a
     rider settlement, business pulls an analytics report. Record the
     results as a signed-off checklist in
     `/docs/uat-signoff.md`.

Output: hardened, documented, deployable platform with CI/CD across all
apps, monitoring/alerting live in staging, a completed security review,
and the full documentation package listed above.
```

## Definition of Done

- [ ] ≥80% coverage on domain/application layers; e2e coverage on every
      controller endpoint (happy path + one auth-failure case)
- [ ] Load test results documented and within target thresholds
- [ ] CI/CD green end-to-end for backend and all three frontend apps,
      deploying to staging automatically
- [ ] Monitoring/alerting live and verified with a deliberately
      triggered test alert
- [ ] Security review checklist completed with no unresolved
      high/critical findings
- [ ] Full documentation package present and accurate to the actual
      built system
- [ ] Final UAT scenario executed and signed off in
      `/docs/uat-signoff.md`

This is the final phase. The platform is now ready for a production
launch decision.
