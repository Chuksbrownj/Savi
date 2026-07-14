# Phase 3 — Authentication, RBAC & Security

## Goal

Implement the full identity module: registration, login, OTP
verification, JWT + refresh token auth, RBAC guards, and the security
baseline (rate limiting, input validation, password hashing, audit
logging, secure file uploads) required before any business feature is
exposed.

## Build Prompt

```
Implement the `identity` bounded context and platform-wide security
baseline for the Laundry Management Platform. Requirements:

1. REGISTRATION & LOGIN
   - Endpoints (all under `/api/v1/auth`):
     - `POST /register/customer` — email or phone + password, creates
       User(userType=Customer) + CustomerProfile.
     - `POST /register/business` — creates User(userType=BusinessOwner)
       + Business + default Branch in one transaction.
     - `POST /login` — accepts email OR phone + password, returns
       access token (short-lived, 15 min) + refresh token (long-lived,
       7-30 days, rotated on use).
     - `POST /refresh` — exchanges a valid refresh token for a new
       access/refresh pair; old refresh token is invalidated
       (rotation, stored hashed in DB with a `RefreshToken` table:
       id, userId, tokenHash, expiresAt, revokedAt, replacedByTokenId).
     - `POST /logout` — revokes the current refresh token.
     - `POST /logout-all` — revokes all refresh tokens for the user.
   - Passwords hashed with Argon2id (preferred) or bcrypt (cost 12+).
     Never log or return password hashes.
   - Business Operators and Staff/DispatchRiders are created by the
     Business Operator (Phase 5/6 will add those endpoints) — they do
     NOT self-register through the public API except the initial
     Business Owner registration above.

2. OTP VERIFICATION
   - `POST /auth/otp/request` — sends a 6-digit OTP via SMS (phone) or
     email, expires in 5 minutes, rate-limited to 1 request per 60s per
     identifier and max 5 per hour.
   - `POST /auth/otp/verify` — verifies OTP, marks
     `isPhoneVerified`/`isEmailVerified` true. Required before a
     Customer can place their first order.
   - Store OTPs hashed in Redis with TTL, never in plaintext logs.
   - Stub the actual SMS/email send behind a provider interface
     (`IOtpSender`) so Phase 9 can wire real providers; for now, log to
     console in dev mode and implement a fake provider for tests.

3. JWT STRATEGY
   - Access token payload: `{ sub: userId, userType, roleId,
     businessId (nullable), branchId (nullable) }` — no PII beyond
     userId.
   - Use RS256 (asymmetric) if feasible for future multi-service
     verification; otherwise HS256 with a strong secret from config.
   - Implement `JwtAuthGuard` (global by default, with
     `@Public()` decorator to opt out for public endpoints like
     service catalog browsing).

4. RBAC
   - Implement `RolesGuard` + `@RequirePermissions('orders:approve')`
     decorator, checking the user's role's permissions (loaded from DB,
     cached in Redis per role with short TTL, invalidated on role
     permission change).
   - Enforce PRD role boundaries explicitly with guard tests:
     - DispatchRider role must be REJECTED (403) on any endpoint that
       creates orders, assigns dispatch tasks, or edits orders — even
       if they craft the request directly.
     - Customer role must be REJECTED on any Business or Dispatch
       endpoint.
   - Implement a `@CurrentUser()` param decorator exposing the
     authenticated user + role + business/branch scope to controllers.
   - Multi-tenancy scoping: every Business-side query must be
     automatically scoped to `businessId` from the JWT — implement this
     as a repository-level guard/interceptor, not ad-hoc per query, to
     prevent cross-business data leaks.

5. RATE LIMITING
   - `@nestjs/throttler` global default (e.g. 100 req/min per IP), with
     stricter overrides on `/auth/login` (5/min), `/auth/otp/request`
     (as above), and `/auth/register/*` (10/hour per IP).

6. INPUT VALIDATION
   - Global `ValidationPipe` with `whitelist: true`,
     `forbidNonWhitelisted: true`, `transform: true`.
   - DTOs for every auth endpoint with class-validator decorators
     (email format, phone format via libphonenumber-js, password
     policy: min 8 chars, at least 1 letter + 1 number).

7. AUDIT LOGGING
   - Implement an `AuditLogInterceptor` that writes to the AuditLog
     table on every state-changing request (POST/PUT/PATCH/DELETE),
     capturing actor, action, entity, before/after (for updates where
     feasible), IP, user agent.
   - Auth events specifically logged: login success/failure, password
     reset, logout, token refresh, permission changes.

8. SECURE FILE UPLOADS (scaffold now, used fully in Phase 6 for POD and
   Phase 4 for avatars/documents)
   - Presigned S3 upload URLs generated server-side (`POST
     /uploads/presign` — authenticated), never accept raw file bytes
     through the API server itself for large files.
   - Validate file type via content-sniffing (not just extension),
     max size limits per upload type (e.g. 5MB images), and store
     uploads under a per-business/per-user prefix.

9. PASSWORD RESET
   - `POST /auth/forgot-password` — sends a time-limited reset token
     (email or SMS OTP), `POST /auth/reset-password` — consumes it,
     invalidates all existing refresh tokens for that user.

10. TESTING
    - Unit tests: password hashing, JWT generation/verification, RBAC
      guard logic (positive + negative cases per role).
    - E2E tests: full register → OTP verify → login → refresh →
      logout flow; and a negative test proving a DispatchRider token
      is rejected on an order-assignment endpoint.

Output: a fully working `identity` module, global security middleware,
and a `/docs/security.md` describing the auth flow, token lifetimes,
and RBAC matrix (roles × permissions table).
```

## Definition of Done

- [ ] Full register/login/refresh/logout/OTP flow works end-to-end
- [ ] RBAC matrix documented and enforced by guards, not just UI
- [ ] Multi-tenancy scoping verified with a test (Business A cannot see
      Business B's data even with a valid but wrong-scoped token)
- [ ] Rate limits active on sensitive endpoints
- [ ] Audit log entries created for auth events and verified in a test
- [ ] Presigned upload flow works against S3 (or local MinIO in dev)
- [ ] `/docs/security.md` committed

Proceed to `phase-04-customer-module.md`.
