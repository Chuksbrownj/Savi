# Phase 9 — Notifications System

## Goal

Wire up real push (FCM), email, and SMS delivery, replacing the stubs
from Phases 3, 5, 6, and 8, and build an in-app notification center
consumable by all three frontends.

## Build Prompt

```
Implement the `notifications` module as an event-driven system that
subscribes to domain events emitted elsewhere in the platform (order
status changes from Phase 7, dispatch assignments from Phase 5, OTPs
from Phase 3, payment confirmations from Phase 8) and delivers them via
the appropriate channel(s). Requirements:

1. PROVIDER ADAPTERS
   - `IPushSender` → Firebase Cloud Messaging adapter. Support device
     token registration: `POST /notifications/device-tokens`
     (authenticated, any role) to register/refresh an FCM token per
     user/device; handle multi-device users (a user can have several
     tokens).
   - `IEmailSender` → SES or SendGrid adapter (pick one, document as
     ADR), with HTML templates (use a templating engine like Handlebars
     or MJML-compiled templates) for: OTP, order confirmation, payment
     receipt, order status updates, staff/rider invite, password
     reset.
   - `ISmsSender` → Termii or Twilio adapter (pick one per target
     market — Termii for NG/Africa-first, Twilio for global; document
     the choice), used for OTP and critical order alerts.
   - Replace the Phase 3 fake OTP sender with the real
     `ISmsSender`/`IEmailSender` behind the same `IOtpSender`
     interface — no changes needed to Phase 3 call sites.

2. EVENT SUBSCRIPTION
   - Subscribe to domain events via the event bus set up in Phase 7:
     - `OrderStatusChanged` → notify customer (always) and business
       (for statuses requiring their attention, e.g.
       `AwaitingPickupAssignment`) and rider (when assigned).
     - `DispatchTaskAssigned` → push notification to the specific
       rider.
     - `PaymentConfirmed` / `PaymentFailed` → notify customer.
     - `SettlementProcessed` → notify rider.
     - `SupportTicketCreated` / `SupportTicketResolved` → notify
       relevant party.
   - Each event → notification mapping should be defined in a config
     table/map, not scattered across modules, so channel routing
     (push vs email vs SMS vs in-app) is centrally adjustable per
     notification type and per user preference.

3. USER NOTIFICATION PREFERENCES
   - `GET/PATCH /notifications/preferences` — let users opt out of
     non-critical channels per category (e.g. disable marketing email,
     but OTP/security notifications are never optional).
   - Respect preferences before sending, except for a hardcoded
     "critical" category (OTP, payment failure, order cancellation)
     that always sends.

4. IN-APP NOTIFICATION CENTER
   - Every notification also persists to the `Notification` table
     (from Phase 2 schema) regardless of channel, so it appears in an
     in-app inbox.
   - `GET /notifications` — paginated, filterable by isRead.
   - `PATCH /notifications/:id/read`, `POST /notifications/read-all`.
   - Consider a WebSocket gateway (Socket.IO via `@nestjs/websockets`)
     for real-time in-app delivery + live order tracking updates (rider
     location, status changes) to the Customer and Business Flutter
     apps, in addition to FCM push for background/killed-app delivery.

5. DELIVERY RELIABILITY
   - Queue all outbound notifications through BullMQ (from Phase 1)
     rather than sending synchronously in the request/response cycle —
     notification failures must never block the triggering business
     action (e.g. a failed SMS must not roll back an order status
     change).
   - Implement retry with exponential backoff (e.g. 3 attempts) per
     notification job; log permanent failures for ops visibility.

6. RATE LIMITING & ABUSE PREVENTION
   - Cap SMS/email volume per user per hour to prevent cost abuse from
     bugs or malicious triggering (e.g. max 20 notifications/hour/user
     outside OTP's own stricter limit from Phase 3).

7. TESTING
   - Unit tests per adapter (mocked provider SDKs).
   - Integration test: emit an `OrderStatusChanged` event, assert the
     correct notification jobs are enqueued with correct
     recipients/channels.
   - Test that a user who disabled email marketing still receives
     critical SMS/push for the same event category if that's how
     preferences are scoped.
   - Load-adjacent test: confirm queueing means a slow/failing
     provider doesn't block the HTTP response of the triggering
     endpoint (simulate a slow mock provider).

Output: complete `notifications` module with real provider adapters
(sandbox/test credentials), event subscriptions wired to Phases 3/5/6/7/
8, in-app notification center endpoints, optional WebSocket gateway for
live tracking, and the test suite above. Document channel-routing rules
in `/docs/notifications.md`.
```

## Definition of Done

- [ ] Real FCM/email/SMS adapters working against sandbox credentials
- [ ] All relevant domain events trigger correctly routed notifications
- [ ] Notifications are queued, not synchronous, and don't block the
      triggering request
- [ ] In-app notification center CRUD works and persists every
      notification regardless of channel
- [ ] User preferences respected except for hardcoded critical category
- [ ] `/docs/notifications.md` documents the event → channel matrix

Proceed to `phase-10-reports-analytics-admin.md`.
