# Authentication, RBAC & Security

## Overview

All authentication flows use **JWT Bearer tokens** (access) + **opaque rotation tokens** (refresh).  
Authorization uses **Role-Based Access Control (RBAC)** with **permission codes** at the route level.

---

## Token Lifetimes

| Token                  | Lifetime   | Storage                                   |
| ---------------------- | ---------- | ----------------------------------------- |
| Access Token (JWT)     | 15 minutes | Client memory / Authorization header      |
| Refresh Token (opaque) | 7 days     | HTTP-only cookie or secure client storage |

Both lifetimes are configurable via environment variables:

- `JWT_ACCESS_EXPIRES_IN` (e.g. `15m`)
- `JWT_REFRESH_EXPIRES_IN` (e.g. `7d`)

---

## Auth Flow

```
Client                         API Server                   DB / Redis
  │                               │                            │
  ├─ POST /auth/register ─────────►                            │
  │                               ├── hash password (Argon2id)─►
  │                               ├── create User + Profile ───►
  │                               ├── create RefreshToken hash ►
  │◄── 201 { user, tokens } ──────┤                            │
  │                               │                            │
  ├─ POST /auth/otp/request ──────►                            │
  │                               ├── generate 6-digit OTP     │
  │                               ├── SHA-256 hash OTP ────────► Redis (5 min TTL)
  │                               ├── ConsoleOtpSender.send()  │
  │◄── 200 { message } ───────────┤                            │
  │                               │                            │
  ├─ POST /auth/otp/verify ───────►                            │
  │                               ├── compare hash ────────────► Redis
  │                               ├── delete OTP from Redis ───►
  │                               ├── mark user verified ──────►
  │◄── 200 { message } ───────────┤                            │
  │                               │                            │
  ├─ POST /auth/login ────────────►                            │
  │                               ├── find user by email/phone ►
  │                               ├── verify password (Argon2) ►
  │                               ├── store new RefreshToken ──►
  │◄── 200 { user, tokens } ──────┤                            │
  │                               │                            │
  ├─ POST /auth/refresh ──────────►                            │
  │  { refreshToken }             ├── hash token, find in DB ──►
  │                               ├── revoke old, issue new ───►
  │◄── 200 { accessToken, refresh}┤                            │
  │                               │                            │
  ├─ POST /auth/logout ───────────►                            │
  │  + Bearer accessToken         ├── revoke refresh token ────►
  │◄── 200 { message } ───────────┤                            │
```

---

## RBAC Design

### Principals & Roles

| User Type       | Default Role           | Scope                          |
| --------------- | ---------------------- | ------------------------------ |
| `Customer`      | Customer               | Own data only                  |
| `BusinessOwner` | BusinessOwner          | Own business + all branches    |
| `Staff`         | Role assigned by owner | businessId + branchId from JWT |
| `DispatchRider` | Rider                  | Assigned orders only           |
| `Admin`         | SuperAdmin             | System-wide                    |

### Permission Code Format

Permissions follow the `resource:action` pattern, e.g.:

- `orders:view`, `orders:approve`, `orders:cancel`
- `staff:manage`, `inventory:write`
- `payments:refund`, `reports:view`

### Guard Chain

Every request passes through:

1. **`ThrottlerGuard`** — rate limiting (100 req/min default, 5 req/min on login)
2. **`JwtAuthGuard`** — validates Bearer token; skips `@Public()` routes
3. **`RolesGuard`** — checks `@RequirePermissions()` codes against DB role

```
Request ──► ThrottlerGuard ──► JwtAuthGuard ──► RolesGuard ──► Controller
                                     │                │
                               @Public() → skip   No codes → pass
```

---

## Security Design Decisions

| Decision                    | Rationale                                                                        |
| --------------------------- | -------------------------------------------------------------------------------- |
| Argon2id for passwords      | Resistant to GPU/ASIC attacks; tuned to 64 MiB / 3 iterations                    |
| SHA-256 for refresh tokens  | Opaque tokens; hash stored in DB so plaintext is never persisted                 |
| Refresh token rotation      | Each refresh revokes the old token and issues new; reuse triggers 401            |
| OTPs hashed in Redis        | 5 min TTL; consumed on first verify to prevent replay                            |
| `@Public()` opt-out pattern | All routes are authenticated by default; endpoints explicitly opt out            |
| `businessId` from JWT       | Multi-tenancy scope is never trusted from request body; always from verified JWT |
| Audit log on all mutations  | `AuditLogInterceptor` writes to `AuditLog` table on POST/PUT/PATCH/DELETE        |

---

## OTP Provider Swap (Production)

In development, `ConsoleOtpSender` logs codes to console.  
To switch to a real provider (e.g. Termii SMS), create a new class implementing `IOtpSender` and swap the binding in `IdentityModule`:

```typescript
// IdentityModule providers
{ provide: OTP_SENDER, useClass: TermiiOtpSender }  // Production
{ provide: OTP_SENDER, useClass: ConsoleOtpSender } // Development
```
