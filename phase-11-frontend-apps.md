# Phase 11 — Frontend Apps (Flutter Customer, Flutter Dispatch, Flutter Web Business)

## Goal

Build the three role-based client applications consuming the backend
built in Phases 1-10: a Flutter mobile app for Customers, a Flutter
mobile app for Dispatch Riders, and a Flutter Web dashboard for Business
Operators.

## Build Prompt

```
Build three Flutter applications sharing a common core package.
Requirements:

1. SHARED CORE PACKAGE (`packages/core`)
   - API client: generated or hand-written Dio-based client wrapping
     all `/api/v1/*` endpoints from Phases 3-10, with automatic access-
     token attachment and silent refresh-token renewal on 401
     (single-flight refresh to avoid race conditions on concurrent
     requests).
   - Shared models (mirroring backend DTOs) with JSON
     serialization (`json_serializable` or `freezed`).
   - Shared design tokens: color palette, typography scale, spacing
     system — define once, consumed by all three apps for visual
     consistency (adapt per-app where the role's context differs, e.g.
     Business Web skews denser/data-heavy, Customer app skews
     friendly/spacious).
   - State management: choose one (Riverpod recommended for testability
     and code-gen support) and use it consistently across all three
     apps.
   - Secure token storage (`flutter_secure_storage`) — never store JWTs
     in plain SharedPreferences.
   - Error handling: a shared `Result<T>`/`Either` wrapper and a global
     error-to-user-message mapper matching the backend's error envelope
     from Phase 1.
   - WebSocket client wrapper for the Phase 9 real-time gateway (order
     tracking, notifications).

2. CUSTOMER APP (Flutter, iOS + Android)
   - Onboarding: register → OTP verify → login (biometric login
     optional after first success).
   - Home: browse businesses/services, search.
   - Order creation flow: select business/branch → add items per
     service (with live price calc reflecting server-computed totals,
     never client-only math for what gets submitted) → schedule pickup
     → choose payment method → checkout (gateway redirect/SDK per
     Phase 8 provider — e.g. Paystack's Flutter SDK for in-app charge).
   - Order tracking: live status timeline, map showing rider location
     during pickup/delivery (Google Maps Flutter plugin), push
     notifications for status changes.
   - Order history, ratings, support ticket creation, profile/address
     management.
   - Empty/error/loading states designed intentionally, not default
     spinners everywhere — follow the shared design tokens.

3. DISPATCH RIDER APP (Flutter, Android-first given field-worker
   context, iOS supported)
   - Login (riders don't self-register — they receive an invite from
     Phase 5's staff invite flow, set password on first login).
   - Availability toggle (prominent, always visible).
   - Job list: assigned jobs with pull-to-refresh and push-triggered
     real-time updates (no self-assignment UI — there is intentionally
     no "browse available jobs" screen, matching the PRD's core
     principle).
   - Job detail: accept/reject, in-app navigation hand-off to Google
     Maps/Waze for turn-by-turn, pickup/delivery confirmation with
     camera capture for proof of delivery (compress images
     client-side before upload to respect the 5MB limit from Phase 3).
   - Job history and earnings/settlement view (read-only).
   - Designed for one-handed field use: large tap targets, minimal
     typing, offline-tolerant (queue confirm actions if connectivity
     drops, retry on reconnect — use a local queue, e.g.
     `connectivity_plus` + a retry worker).

4. BUSINESS WEB DASHBOARD (Flutter Web)
   - Login (business owner/staff), role-aware navigation (staff sees
     only what their permissions allow — hide, don't just disable,
     unauthorized nav items).
   - Orders board: list/kanban view by status, with approve/assign/
     status-update actions calling Phase 5 endpoints; assignment UI
     shows only `Online` riders.
   - Pricing/branch/staff/rider management screens (CRUD forms).
   - Dashboard/analytics screens consuming Phase 10 endpoints: charts
     (use `fl_chart` or `syncfusion_flutter_charts`) for trends,
     service breakdown, rider performance.
   - Report export UI: trigger async export, poll job status, show
     download link when ready (per Phase 10's async flow).
   - Responsive layout for desktop-first use but functional down to
     tablet width.

5. CROSS-CUTTING FRONTEND CONCERNS
   - Environment config per app (dev/staging/prod API base URLs) via
     `--dart-define` or `.env` + `flutter_dotenv`.
   - Crash reporting + analytics (Firebase Crashlytics + Analytics) in
     all three apps.
   - Localization scaffold (`flutter_intl` or `easy_localization`) even
     if only English ships initially — set up the pattern now.
   - Accessibility basics: semantic labels on interactive elements,
     minimum tap target sizes, color contrast per WCAG AA on the design
     tokens.

6. TESTING
   - Widget tests for critical flows (order creation form validation,
     job accept/reject buttons, availability toggle).
   - Integration tests (`integration_test` package) for at least one
     full flow per app: Customer full order journey (mocked API),
     Rider job-accept-to-delivery journey (mocked API), Business
     order-approval-to-assignment journey (mocked API).
   - Golden tests for key screens against the shared design tokens to
     catch visual regressions.

Output: three Flutter app targets (`apps/customer`, `apps/dispatch`,
`apps/business_web`) plus `packages/core`, each buildable
independently, with the test suites above and a top-level
`/docs/frontend-architecture.md` describing the shared-package strategy
and state management conventions.
```

## Definition of Done

- [ ] All three apps build and run against the Phase 1-10 backend
      (dev environment)
- [ ] Token refresh works silently without user-visible logouts on
      access-token expiry
- [ ] Rider app has no self-assignment UI anywhere (verified by
      screen inventory review)
- [ ] Business Web hides unauthorized nav/actions per role, not just
      disables them
- [ ] Proof-of-delivery photo capture + compressed upload works
      end-to-end
- [ ] Async report export UI correctly polls and surfaces the
      download link
- [ ] Widget/integration/golden test suites pass in CI

Proceed to `phase-12-testing-devops-deployment.md`.
