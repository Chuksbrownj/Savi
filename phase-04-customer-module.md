# Phase 4 — Customer Module (Public API)

## Goal

Build every customer-facing capability from the PRD: browsing services
and pricing, managing profile/addresses, creating orders, choosing a
payment method, tracking orders, viewing history, and rating completed
orders — all scoped correctly by RBAC to the Customer role.

## Build Prompt

```
Implement the Customer-facing API surface under `/api/v1/customer/*`,
protected by the Customer role guard from Phase 3. Requirements:

1. PROFILE & ADDRESSES
   - `GET/PATCH /customer/profile` — view/update name, email, phone
     (phone/email changes trigger re-verification via OTP).
   - `GET/POST/PATCH/DELETE /customer/addresses` — full CRUD, with one
     address flaggable as default (`isDefault`); enforce only one
     default per customer at the service layer.
   - Address creation should validate lat/lng via Google Maps
     Geocoding API (stub the adapter now, wire real key in Phase 11 if
     not already available).

2. SERVICE & PRICING BROWSING (public, no auth required —
   use `@Public()`)
   - `GET /businesses` — list active businesses (with basic filters:
     city, name search).
   - `GET /businesses/:businessId/services` — list active
     LaundryServices with current Pricing for that business.
   - Support pagination and filtering by ServiceType.

3. ORDER CREATION
   - `POST /customer/orders` — create an order in `Draft` status:
     - businessId, branchId, pickup address, delivery address
       (defaults to pickup address if delivery goes back to customer),
       scheduledPickupAt, isExpress, list of OrderItems (serviceId,
       quantity/weight, notes).
     - Server calculates subtotal/discount/deliveryFee/total from live
       Pricing — client-submitted prices are ALWAYS ignored/recomputed
       server-side (critical: never trust client-side totals).
     - Validate the customer is phone/email-verified before allowing
       order creation (from Phase 3 OTP flow).
   - `PATCH /customer/orders/:id` — allowed ONLY while status is
     `Draft` (add/remove items, change schedule/address). Any other
     status returns 409 Conflict with a clear error.
   - `POST /customer/orders/:id/apply-promotion` — validates a
     Promotion code against business, expiry, usage limit, and
     recalculates total.

4. PAYMENT METHOD SELECTION
   - `POST /customer/orders/:id/payment-method` — customer chooses
     Full, Part, or PayOnDelivery. For Part, require a minimum percent
     (configurable per business, default 30%) and compute the amount
     due now vs on delivery.
   - This endpoint transitions the order from `Draft` to
     `AwaitingPayment` and hands off to the Payments module (Phase 8)
     for the actual charge — here you only record the customer's
     choice and expected amounts; do NOT implement gateway charging in
     this phase, stub the `PaymentInitiationService` interface to be
     completed in Phase 8.

5. ORDER TRACKING & HISTORY
   - `GET /customer/orders` — paginated list, filterable by status
     and date range.
   - `GET /customer/orders/:id` — full order detail including current
     status, status history (timestamped), assigned rider's first
     name + vehicle type + live location if a DispatchTask is
     InProgress (masked — no rider phone number exposed directly;
     provide a masked-call or in-app-only contact channel later).
   - `GET /customer/orders/:id/timeline` — returns the ordered list of
     status transitions with timestamps, matching the PRD's 17-step
     flow (or fewer if some steps are skipped/combined per business
     config).

6. ORDER CONFIRMATION & CANCELLATION
   - `POST /customer/orders/:id/confirm-receipt` — customer confirms
     delivery received; transitions `Delivered` → `Completed`.
   - `POST /customer/orders/:id/cancel` — allowed only in early
     statuses (`Draft`, `AwaitingPayment`, `PaymentConfirmed`,
     `AwaitingPickupAssignment`); once pickup is assigned, cancellation
     requires business approval (create a cancellation-request flow
     instead — log intent, notify business, business finalizes in
     Phase 5).

7. RATINGS & SUPPORT
   - `POST /customer/orders/:id/rating` — allowed only when order is
     `Completed`, one rating per order, rates business (1-5) and
     optionally rider (1-5) separately.
   - `POST /customer/support-tickets`, `GET /customer/support-tickets`,
     `GET /customer/support-tickets/:id` — create/view tickets, linked
     optionally to an order.

8. VALIDATION & EDGE CASES
   - Reject order creation if the chosen branch is inactive or
     `operatingHours` indicates it's closed for the requested pickup
     window.
   - Reject address selection if lat/lng falls outside the business's
     configured service radius (if defined) — return a clear 422 with
     the reason.
   - All monetary calculations done in integer minor units (kobo/cents)
     internally to avoid floating point errors; expose as decimals in
     API responses.

9. TESTING
   - E2E test covering the full customer happy path: browse services →
     create order → apply promotion → choose payment method → track →
     confirm receipt → rate.
   - Unit tests for total/discount calculation logic (this is
     business-critical — cover edge cases: zero-quantity items,
     expired promotions, express surcharge stacking with percent
     discount).

Output: complete `orders` (customer-facing slice) and `catalog`
(read-only) module implementations, with Swagger docs and the test
suite above.
```

## Definition of Done

- [ ] Customer can complete the full flow via API: browse → order →
      pay-method select → track → confirm → rate
- [ ] Server-side price recalculation verified (client-submitted totals
      cannot be trusted or used)
- [ ] Order edits blocked outside `Draft` status (409 test passes)
- [ ] Cancellation rules match PRD staging (early vs post-pickup)
- [ ] Rating restricted to `Completed` orders, one per order
- [ ] All money math covered by unit tests, no floating-point bugs

Proceed to `phase-05-business-operator-module.md`.
