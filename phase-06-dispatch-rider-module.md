# Phase 6 — Dispatch Rider Module

## Goal

Implement the Dispatch Rider's API surface: viewing assigned jobs,
accepting/rejecting them, confirming pickup and delivery, capturing
proof of delivery, toggling availability — strictly within the "riders
never initiate work" constraint from the PRD.

## Build Prompt

```
Implement the Dispatch Rider-facing API surface under
`/api/v1/dispatch/*`, protected by the DispatchRider role. Every
endpoint here operates on tasks that ALREADY EXIST and were created by
the business (Phase 5) — no endpoint in this module may create, assign,
or reassign a DispatchTask, edit an Order, or set prices.

1. AVAILABILITY
   - `PATCH /dispatch/availability` — toggle `Online`/`Offline`. A
     rider who is `OnJob` cannot manually set `Offline` (must complete
     or the business must reassign); return 409 if attempted.
   - `PATCH /dispatch/location` — rider app pings current lat/lng
     periodically (e.g. every 15-30s while `OnJob`); store on
     `DispatchRiderProfile.currentLat/Lng` and optionally a
     `RiderLocationHistory` table for the audit trail / ETA
     calculations. Rate-limit this endpoint to prevent abuse.

2. ASSIGNED JOBS
   - `GET /dispatch/jobs` — list DispatchTasks assigned to this rider,
     filterable by status (`Assigned`, `Accepted`, `InProgress`,
     `Completed`). Includes order summary (item count, pickup/delivery
     address, customer first name + masked phone, special notes).
   - `GET /dispatch/jobs/:id` — full task detail.

3. ACCEPT / REJECT
   - `POST /dispatch/jobs/:id/accept` — only valid while task status is
     `Assigned` and belongs to this rider; transitions task to
     `Accepted`, rider availability to `OnJob`.
   - `POST /dispatch/jobs/:id/reject` — requires a reason; transitions
     task to `Rejected`. This does NOT create a new assignment — it
     notifies the business, who must reassign via the Phase 5
     `reassign` endpoint. The rider's rejection must never trigger
     auto-reassignment to another rider from within this module (that
     would violate "riders never initiate work" — reassignment is
     always a business action, even if triggered by a notification).

4. PICKUP FLOW
   - `POST /dispatch/jobs/:id/start` — task type must be `Pickup`,
     status `Accepted` → `InProgress`; order status
     `PickupAssigned` → `PickupInProgress`.
   - `POST /dispatch/jobs/:id/confirm-pickup` — rider confirms they
     have physically collected the laundry from the customer:
     - Requires photo evidence upload (presigned S3 URL from Phase 3)
       of the collected items.
     - Optionally requires customer signature capture (image).
     - Transitions DispatchTask → `Completed`, Order status →
       `LaundryReceived` ONLY once the rider also confirms delivery
       to the business location (see note below) — model this as two
       sub-steps if your PRD interpretation requires physical
       drop-off at the business branch:
       `confirm-pickup` (from customer) → order status stays
       `PickupInProgress` until →
       `confirm-dropoff-at-business` (rider hands off to branch staff)
       → order status becomes `LaundryReceived`.
     - Document this two-step interpretation explicitly since the PRD
       says "Rider picks up laundry and delivers it to business" as
       one workflow step but it is physically two actions.
   - Rider availability reverts to `Online` after task completion
     (unless immediately assigned another task by the business).

5. DELIVERY FLOW
   - `POST /dispatch/jobs/:id/start` — task type `Delivery`, status
     `Accepted` → `InProgress`; order status `DeliveryAssigned` →
     `OutForDelivery`.
   - `POST /dispatch/jobs/:id/confirm-delivery` — requires photo proof
     and optional recipient signature/name; transitions DispatchTask →
     `Completed`, order status `OutForDelivery` → `Delivered`.
   - `POST /dispatch/jobs/:id/report-issue` — for failed delivery
     (customer unreachable, wrong address, refused delivery); logs a
     structured issue, notifies business, does NOT change order status
     itself — business decides next step (redeliver, cancel, refund)
     via Phase 5 endpoints.

6. PROOF OF DELIVERY (POD)
   - Implement `ProofOfDelivery` creation as part of both
     `confirm-pickup` and `confirm-delivery` above (one POD record per
     dispatch task, type inferred from task type).
   - Enforce photo upload is mandatory (reject the confirm-* call with
     422 if no `imageUrl` provided) — this is a compliance/dispute
     requirement.

7. JOB HISTORY & EARNINGS VISIBILITY
   - `GET /dispatch/jobs/history` — completed tasks, paginated.
   - `GET /dispatch/earnings` — read-only view of this rider's
     Settlement records and pending (unsettled) completed task fees.
     Riders can VIEW but never modify settlement data (no write
     endpoints in this module for Settlement).

8. PAYMENT BOUNDARY ENFORCEMENT
   - Add an explicit architectural test/lint rule: no controller,
     service, or repository method in the `dispatch` module may write
     to the `Payment` table. Dispatch riders never collect or record
     customer payments directly, per PRD payment rules. If a "cash
     collected" scenario is needed for PayOnDelivery, the rider only
     marks "cash collection confirmed" as a flag on the DispatchTask
     (`cashCollected: boolean`), and the actual `Payment` record is
     created/confirmed by the business via the Phase 5/8 payment
     confirmation endpoint, not by this module directly.

9. TESTING
   - E2E: full rider flow — go online → receive assigned job (seeded
     via a Phase 5 assignment call in test setup) → accept → start →
     confirm pickup with photo → confirm dropoff at business → (later)
     accept delivery job → start → confirm delivery with photo →
     verify order reaches `Delivered`.
   - Negative tests: rider cannot accept/act on a job not assigned to
     them (403/404); rider cannot call any business-only endpoint
     (403); confirm-* without photo returns 422; rider cannot write to
     Payment table (architecture test, e.g. using dependency-cruiser or
     a custom static check).

Output: complete `dispatch` module (rider-facing slice) with Swagger
docs, the architecture boundary test, and the e2e/negative test suite
above.
```

## Definition of Done

- [ ] Rider can only act on tasks explicitly assigned to them by the
      business — verified by tests
- [ ] No code path allows a rider to create, assign, or reassign a
      DispatchTask, or edit an Order
- [ ] Photo proof is mandatory on pickup and delivery confirmation
- [ ] Rider never writes to the Payment table (architecture-level check
      in place, not just convention)
- [ ] Availability state machine (`Online`/`Offline`/`OnJob`) is
      consistent and cannot be bypassed
- [ ] Full pickup→dropoff→delivery e2e flow passes

Proceed to `phase-07-order-status-workflow-engine.md`.
