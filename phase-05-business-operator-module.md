# Phase 5 — Business Operator Module

## Goal

Implement the control-center capabilities that make the Business
Operator the authority over every operation: order approval, payment
confirmation, dispatch rider assignment, laundry status updates, pricing
and branch/staff management, customer management, and rider settlement
initiation.

## Build Prompt

```
Implement the Business-facing API surface under `/api/v1/business/*`,
protected by BusinessOwner/Staff roles with granular permissions from
the RBAC system (Phase 3). Every endpoint here must be scoped to the
caller's `businessId` (and `branchId` where relevant) automatically —
no cross-business access, verified by tests.

1. ORDER REVIEW & APPROVAL
   - `GET /business/orders` — paginated, filterable by status, branch,
     date range, customer.
   - `GET /business/orders/:id` — full detail including payment status
     and item breakdown.
   - `POST /business/orders/:id/approve` — moves an order from
     `PaymentConfirmed` to `AwaitingPickupAssignment` (only permitted
     once payment status supports it per the payment method rules from
     Phase 8 — e.g. PayOnDelivery orders can be approved without
     upfront payment).
   - `POST /business/orders/:id/reject` — with a required reason,
     notifies customer, order moves to `Cancelled`.

2. PAYMENT CONFIRMATION
   - `POST /business/orders/:id/confirm-payment` — for manual payment
     confirmation paths (e.g. bank transfer proof uploaded by
     customer); automatic gateway confirmations are handled by webhook
     in Phase 8. This endpoint requires an explicit permission
     (`payments:confirm_manual`) separate from general order approval,
     since it's financially sensitive — log to AuditLog with before/
     after payment status.

3. DISPATCH ASSIGNMENT (core of "business controls every operation")
   - `POST /business/orders/:id/assign-pickup-rider` — body:
     `{ riderId }`. Validates:
     - rider belongs to this business
     - rider's `availability` is `Online`
     - order status is `AwaitingPickupAssignment`
     Creates a `DispatchTask(type=Pickup, status=Assigned)`, transitions
     order to `PickupAssigned`, notifies the rider (Phase 9 handles the
     actual push).
   - `POST /business/orders/:id/assign-delivery-rider` — same pattern
     for the delivery leg, valid only once order is `ReadyForDelivery`.
   - `POST /business/dispatch-tasks/:id/reassign` — business can
     reassign a task to a different rider at any point before
     completion (e.g. original rider rejected or went offline);
     original task is marked `Cancelled`, a new one created.
   - `POST /business/dispatch-tasks/:id/cancel` — business-only
     cancellation of a dispatch task.
   - IMPORTANT: There must be NO endpoint anywhere in the codebase that
     allows a DispatchRider to call any of the above. Add an explicit
     e2e test proving a valid DispatchRider JWT gets 403 on all four.

4. LAUNDRY PROCESSING STATUS UPDATES
   - `POST /business/orders/:id/status` — body: `{ status, notes? }`,
     restricted to a whitelist of valid forward transitions for the
     processing stages the business (not dispatch) owns:
     `LaundryReceived → Sorting → Washing → Drying → Ironing →
     Packaging → ReadyForDelivery`. Use the state machine from Phase 7
     (build this endpoint against that engine, do not hand-roll status
     transition logic here).

5. PRICING MANAGEMENT
   - `GET/POST/PATCH/DELETE /business/services` — manage which
     LaundryServices this business offers (from the fixed catalog:
     Wash Only, Wash & Iron, Iron Only, Dry Cleaning, Blankets,
     Curtains, Shoes, Bags, Special Care, Express).
   - `GET/POST/PATCH /business/pricing` — set/update base price, unit
     (PerItem/PerKg), express surcharge percent, per service. Price
     changes must NOT retroactively affect existing orders (orders
     snapshot price at creation time — verify this was implemented
     correctly in Phase 4/2).

6. BRANCH MANAGEMENT
   - `GET/POST/PATCH/DELETE /business/branches` — CRUD, including
     operating hours and service radius config.

7. STAFF MANAGEMENT
   - `POST /business/staff` — invites/creates a Staff or DispatchRider
     user under this business (this is how those roles get created —
     NOT via public self-registration). Sends an invite email/SMS with
     a temporary password or magic-link setup flow.
   - `GET/PATCH/DELETE /business/staff` — manage staff, assign
     branch + role, deactivate.
   - `POST /business/riders` — same pattern for dispatch riders,
     including Vehicle registration.
   - `PATCH /business/staff/:id/role` — reassign a staff member's role
     (must go through RBAC's role/permission set, not a free-text
     field).

8. CUSTOMER MANAGEMENT
   - `GET /business/customers` — list customers who've ordered from
     this business, with lifetime order count/value.
   - `GET /business/customers/:id` — profile + order history scoped to
     this business only (never expose a customer's orders from other
     businesses).
   - `POST /business/customers/:id/note` — internal staff note on a
     customer (not visible to the customer).

9. PROMOTIONS
   - `GET/POST/PATCH/DELETE /business/promotions` — manage discount
     codes scoped to the business.

10. SETTLEMENT INITIATION (full settlement processing is Phase 8;
    here just the business-side trigger)
    - `GET /business/settlements` — view settlement batches/history.
    - `POST /business/settlements/generate` — for a given rider +
      period, compute pending dispatch fees owed and create a
      `Settlement` record in `Pending` status (actual payout
      processing is Phase 8).

11. TESTING
    - E2E: full business flow — approve order → confirm payment →
      assign pickup rider → (simulate rider completing pickup via a
      stub in Phase 6) → update processing statuses → assign delivery
      rider → generate settlement.
    - Explicit negative tests: Staff without `orders:assign_dispatch`
      permission gets 403; DispatchRider gets 403 on all business
      endpoints; Business A's staff token gets 403/404 on Business B's
      orders.

Output: complete `business` module (orders slice, pricing, branches,
staff, customers, promotions, settlement-initiation) with Swagger docs
and the test suite above.
```

## Definition of Done

- [ ] Business can fully control an order's lifecycle through explicit
      approval/assignment endpoints
- [ ] Riders cannot self-assign or edit orders — proven by e2e tests
- [ ] Pricing changes don't retroactively affect existing orders
- [ ] Cross-business data isolation verified by tests
- [ ] Staff/rider creation flows through business-initiated invite, not
      public self-registration
- [ ] Settlement generation produces correct pending amounts from
      completed dispatch tasks

Proceed to `phase-06-dispatch-rider-module.md`.
