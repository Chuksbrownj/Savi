# Phase 7 — Order Status Workflow Engine

## Goal

Extract order status transition logic (currently referenced loosely by
Phases 4-6) into a single, authoritative, testable state machine that
every module calls through — eliminating status-transition bugs and
giving the platform one source of truth for "what can happen next."

> Note: This phase retrofits/centralizes logic that Phases 4-6 stubbed
> against. If you built those phases with inline status checks, refactor
> them now to call this engine instead.

## Build Prompt

```
Implement a centralized Order Status Workflow Engine as a domain
service in the `orders` module. Requirements:

1. STATE MACHINE DEFINITION
   Model the full status flow from the PRD as an explicit directed
   graph (use a library like `xstate` in "state machine as data"
   mode, or a hand-rolled typed transition table — either is fine,
   but it must be declarative and centrally defined, not scattered
   if/else):

   Draft → AwaitingPayment → PaymentConfirmed →
   AwaitingPickupAssignment → PickupAssigned → PickupInProgress →
   LaundryReceived → Sorting → Washing → Drying → Ironing →
   Packaging → ReadyForDelivery → DeliveryAssigned →
   OutForDelivery → Delivered → Completed

   Plus side-branches:
   - Any pre-`PickupAssigned` status → `Cancelled` (customer or
     business initiated)
   - `PickupAssigned`/`DeliveryAssigned`/InProgress statuses →
     `Cancelled` (business-only, e.g. reassignment exhausted)
   - Consider whether some processing stages (Sorting/Washing/Drying/
     Ironing/Packaging) should be skippable per business config (e.g.
     an "Iron Only" order might skip Washing/Drying) — implement an
     optional `applicableStatuses` per order, computed at order
     creation from the services ordered, so the engine only requires
     the relevant subset in sequence.

2. TRANSITION RULES
   For each transition, define:
     - `from` status/statuses
     - `to` status
     - `allowedActors` (Customer / Business / DispatchRider / System)
     - `guard` (a predicate function — e.g. "payment must be
       Paid or PayOnDelivery selected" before AwaitingPayment →
       PaymentConfirmed)
     - `sideEffects` (domain events to emit, e.g.
       `OrderStatusChanged`, consumed by Notifications in Phase 9)

   Example table (illustrative, implement in full):
   | From | To | Actor | Guard |
   |---|---|---|---|
   | Draft | AwaitingPayment | Customer | order has ≥1 item |
   | AwaitingPayment | PaymentConfirmed | System/Business | payment.status is Paid, or method is PayOnDelivery |
   | PaymentConfirmed | AwaitingPickupAssignment | System | business approved order |
   | AwaitingPickupAssignment | PickupAssigned | Business | rider assigned & online |
   | PickupAssigned | PickupInProgress | DispatchRider | rider called start |
   | PickupInProgress | LaundryReceived | DispatchRider | pickup + dropoff-at-business confirmed |
   | LaundryReceived | Sorting..ReadyForDelivery | Business/Staff | sequential, no skipping except per applicableStatuses |
   | ReadyForDelivery | DeliveryAssigned | Business | rider assigned & online |
   | DeliveryAssigned | OutForDelivery | DispatchRider | rider called start |
   | OutForDelivery | Delivered | DispatchRider | delivery confirmed with photo |
   | Delivered | Completed | Customer | confirm-receipt called |
   | Delivered | Completed | System | auto-complete after 48h if customer doesn't confirm (implement as a scheduled job) |

3. ENGINE API
   - `canTransition(order, toStatus, actor): boolean`
   - `transition(order, toStatus, actor, context): Order` — throws a
     typed `InvalidTransitionError` (mapped to 409 Conflict at the API
     layer) if the guard fails or actor isn't allowed.
   - `getAvailableTransitions(order, actor): Status[]` — used by
     frontends to only show valid next actions.
   - Every successful transition:
     - Writes an `OrderStatusHistory` row (id, orderId, fromStatus,
       toStatus, actorUserId, actorType, notes, createdAt) — add this
       table if not already in Phase 2 schema.
     - Emits a domain event (`OrderStatusChanged`) via an in-process
       event bus (Nest's `EventEmitter2` or a lightweight domain event
       dispatcher) for Notifications (Phase 9) and Analytics (Phase 10)
       to subscribe to, decoupling those concerns from the orders
       module.

4. REFACTOR CALLERS
   - Update Phase 4 (customer confirm-receipt, cancel), Phase 5
     (approve, reject, status update), and Phase 6 (start,
     confirm-pickup, confirm-delivery) to call this engine instead of
     mutating `order.status` directly. Remove any duplicated transition
     logic from those modules.

5. AUTO-COMPLETION JOB
   - Implement a scheduled job (BullMQ repeatable job, from Phase 1's
     Redis setup) that runs hourly, finds orders `Delivered` for >48h
     without customer confirmation, and auto-transitions them to
     `Completed` via the engine (actor = System).

6. TESTING
   - Exhaustive unit tests: every legal transition succeeds, every
     illegal transition (wrong actor, wrong from-state, guard failure)
     throws `InvalidTransitionError`.
   - Property-based test (fast-check or similar) generating random
     transition sequences to confirm the engine never allows reaching
     `Completed` without passing through `Delivered`, and never allows
     skipping `PickupAssigned` before `PickupInProgress`.
   - Integration test: confirm `OrderStatusHistory` rows are created
     correctly for a full order lifecycle.

Output: a single `OrderWorkflowService` (or equivalent) as the sole
mutator of order status across the entire codebase, with the full
transition table documented in `/docs/order-status-flow.md` (include a
Mermaid state diagram), refactored callers, the auto-completion job,
and the test suite above.
```

## Definition of Done

- [ ] Single source of truth for status transitions; no module mutates
      `order.status` outside the engine (grep-verified)
- [ ] All PRD statuses represented; illegal transitions rejected with
      409 and a clear message
- [ ] `OrderStatusHistory` populated correctly for full lifecycle
- [ ] Auto-completion job runs and is covered by a test
- [ ] Mermaid diagram in `/docs/order-status-flow.md` matches the
      implemented table exactly

Proceed to `phase-08-payments-settlements.md`.
