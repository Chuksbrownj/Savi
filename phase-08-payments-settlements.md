# Phase 8 — Payments & Settlements

## Goal

Implement real payment processing (Paystack, Flutterwave, Stripe),
enforce the PRD's payment rules (customer pays business only; dispatch
fees flow through the business; riders are settled separately), and
build the settlement engine that pays riders out.

## Build Prompt

```
Implement the `payments` module: gateway integrations, webhook
handling, payment method logic (Full/Part/PayOnDelivery), and rider
settlement processing. Requirements:

1. GATEWAY ABSTRACTION
   - Define a `PaymentGateway` interface: `initiate(order, amount,
     currency, method): { redirectUrl | clientSecret, reference }`,
     `verify(reference): PaymentVerificationResult`,
     `handleWebhook(payload, signature): PaymentEvent`.
   - Implement three adapters: `PaystackGateway`, `FlutterwaveGateway`,
     `StripeGateway`, selected per business config (a business picks
     its default gateway, or per-currency routing if supporting
     multiple regions — default to one gateway per business for
     simplicity unless told otherwise).
   - Never hardcode secret keys — pull from Phase 1's config module,
     one keyset per business if using Connect/split-payment models, or
     a single platform keyset with internal ledger allocation
     (recommend: single platform gateway account + internal ledger,
     simpler to implement correctly; document this choice as an ADR).

2. PAYMENT INITIATION (fulfills the Phase 4 stub)
   - `POST /customer/orders/:id/payments/initiate` — given the
     order's chosen PaymentMethod and computed amount-due-now:
     - Full: charge 100% of total now.
     - Part: charge the configured minimum percent now, remainder
       due before/at delivery (create a second Payment record in
       `Pending` for the balance, triggered again at delivery
       confirmation).
     - PayOnDelivery: no online charge; order proceeds once business
       manually confirms (Phase 5) or rider marks cash collected
       (Phase 6) and business confirms.
   - Returns the gateway's redirect URL or client secret to the
     frontend.

3. WEBHOOKS
   - `POST /webhooks/paystack`, `/webhooks/flutterwave`,
     `/webhooks/stripe` — verify signature per provider's spec (never
     trust unsigned payloads), idempotently update the `Payment`
     record (guard against duplicate webhook delivery using the
     provider's event ID stored uniquely), and call the Phase 7
     workflow engine to transition `AwaitingPayment → PaymentConfirmed`
     when a Full or sufficient Part payment is confirmed.
   - Webhook endpoints are `@Public()` but must verify cryptographic
     signatures — add a test proving an unsigned/forged payload is
     rejected with 400 and never mutates state.

4. PAYMENT RULE ENFORCEMENT (critical PRD constraint)
   - Architectural rule: the ONLY things that can create a `Payment`
     record with a customer as payer are (a) the gateway webhook
     handlers above, or (b) the business's manual
     confirm-payment endpoint (Phase 5) for offline payments (bank
     transfer, cash-on-delivery reconciliation). The `dispatch` module
     must never write to `Payment` (already enforced in Phase 6;
     re-verify with an integration test here).
   - `Payment.payeeType` is always `Business` — there is no
     `Payment` record type where a rider is the payee; rider
     compensation exists ONLY as `Settlement` records, computed from
     completed `DispatchTask`s, paid by the business out of its own
     funds/ledger, not by routing customer payment gateway funds
     directly to a rider account.

5. SETTLEMENT ENGINE
   - Fulfills the Phase 5 `generate` stub with full processing:
   - `Settlement` computation: for a rider + period, sum a
     per-task dispatch fee (configurable per business — flat fee per
     job, or distance-based; implement flat-fee-per-job as the default,
     with a `DispatchFeeConfig` table per business for future
     extensibility).
   - `POST /business/settlements/:id/process` — marks `Processing`,
     triggers payout (bank transfer via gateway payout API where
     supported, e.g. Paystack Transfers/Flutterwave Transfers; abstract
     behind a `PayoutGateway` interface mirroring `PaymentGateway`).
   - `POST /webhooks/payouts/:provider` — confirms payout success/
     failure, updates `Settlement.status` to `Paid` or `Failed`
     accordingly, retries or alerts business on failure.
   - Rider-visible `GET /dispatch/earnings` (from Phase 6) reads from
     these Settlement records — no changes needed there beyond
     ensuring data is now real.

6. REFUNDS
   - `POST /business/orders/:id/refund` — full or partial refund,
     calls the gateway's refund API, creates a `Payment` record with a
     negative amount or a `Refund` linked entity (choose one and
     document it), transitions order status appropriately (does not
     necessarily need a new OrderStatus — consider a
     `refundStatus` field separate from the main workflow, since a
     refund can happen after `Completed`).

7. RECONCILIATION & AUDIT
   - Nightly scheduled job (BullMQ) reconciling local `Payment`
     records against each gateway's transaction list API, flagging
     mismatches into a `PaymentDiscrepancy` table for manual business/
     admin review.
   - All payment and settlement state changes go through AuditLog
     (from Phase 3).

8. TESTING
   - Unit tests per gateway adapter (mocked HTTP), verifying
     signature verification logic specifically (valid, invalid, and
     replayed webhook cases).
   - E2E: Full payment → PaymentConfirmed transition using a test/sandbox
     gateway mode.
   - E2E: Part payment → remainder collected at delivery.
   - E2E: Settlement generation → processing → payout webhook →
     rider earnings updated.
   - Explicit test: confirm no code path allows a Payment record with
     a rider as payee.

Output: complete `payments` module (gateways, webhooks, settlement
engine, refunds, reconciliation job) with Swagger docs (webhooks
excluded from public Swagger, documented separately in
`/docs/webhooks.md`), and the full test suite above.
```

## Definition of Done

- [ ] All three gateways integrated behind a common interface, tested
      in sandbox mode
- [ ] Webhooks verify signatures and are idempotent (duplicate-delivery
      test passes)
- [ ] Full/Part/PayOnDelivery flows all correctly gate the order
      workflow engine transitions
- [ ] Riders are paid only via Settlement, never via direct customer
      Payment records — verified by test
- [ ] Settlement generation, processing, and payout confirmation work
      end-to-end in sandbox
- [ ] Reconciliation job flags a deliberately-introduced mismatch in a
      test

Proceed to `phase-09-notifications.md`.
