# Phase 2 — Database Schema & Core Entities

## Goal

Design and implement the complete PostgreSQL schema (via Prisma) covering
all 20 entities from the PRD, with correct relationships, constraints,
enums, and seed data — forming the single source of truth every later
phase builds on.

## Context

Entities required by the PRD: Customer, Business, Branch, Staff, Dispatch
Rider, Order, Order Item, Laundry Service, Pricing, Address, Payment,
Settlement, Notification, Vehicle, Proof of Delivery, Rating, Support
Ticket, Promotion, Role, Permission, Audit Log.

## Build Prompt

```
Using the Prisma schema (in the `infrastructure` layer), design the full
database schema for the Laundry Management Platform. Requirements:

1. ENUMS
   - OrderStatus: Draft, AwaitingPayment, PaymentConfirmed,
     AwaitingPickupAssignment, PickupAssigned, PickupInProgress,
     LaundryReceived, Sorting, Washing, Drying, Ironing, Packaging,
     ReadyForDelivery, DeliveryAssigned, OutForDelivery, Delivered,
     Completed, Cancelled (add Cancelled — not in the linear flow, but
     required for real-world operation; document this addition).
   - PaymentMethod: Full, Part, PayOnDelivery
   - PaymentStatus: Pending, PartiallyPaid, Paid, Failed, Refunded
   - UserType: Customer, BusinessOwner, Staff, DispatchRider, Admin
   - DispatchTaskType: Pickup, Delivery
   - DispatchTaskStatus: Pending, Assigned, Accepted, Rejected,
     InProgress, Completed, Cancelled
   - RiderAvailability: Online, Offline, OnJob
   - ServiceType: WashOnly, WashAndIron, IronOnly, DryCleaning, Blankets,
     Curtains, Shoes, Bags, SpecialCare, Express
   - SettlementStatus: Pending, Processing, Paid, Failed
   - NotificationChannel: Push, Email, SMS, InApp
   - TicketStatus: Open, InProgress, Resolved, Closed

2. CORE TABLES (with all relevant fields, not just FKs)

   - **Role** (id, name, description, isSystemRole, createdAt)
   - **Permission** (id, code, description, module) — e.g.
     `orders:assign_dispatch`, `orders:approve`, `pricing:manage`
   - **RolePermission** (join table, roleId, permissionId)
   - **User** (base identity: id, email, phone, passwordHash, userType,
     isEmailVerified, isPhoneVerified, isActive, lastLoginAt,
     createdAt, updatedAt) — Customer, Staff, DispatchRider,
     BusinessOwner all reference User via 1:1 or shared discriminator;
     document your polymorphism approach (recommend: single `User` table
     + role-specific profile tables, e.g. `CustomerProfile`,
     `DispatchRiderProfile`, `StaffProfile`) rather than table-per-type
     inheritance, for simpler auth.
   - **CustomerProfile** (userId FK, defaultAddressId, loyaltyPoints
     placeholder, referralCode placeholder)
   - **Business** (id, name, ownerUserId, registrationNumber, logo,
     supportEmail, supportPhone, isActive, createdAt)
   - **Branch** (id, businessId FK, name, address FK, phone,
     operatingHours JSON, isActive)
   - **StaffProfile** (userId FK, businessId FK, branchId FK, roleId FK,
     employeeCode, isActive)
   - **DispatchRiderProfile** (userId FK, businessId FK, vehicleId FK,
     availability enum, currentLat, currentLng, rating avg,
     totalDeliveries, isActive)
   - **Vehicle** (id, riderId FK, type [Bike/Car/Van], plateNumber,
     model, isActive)
   - **Address** (id, userId FK nullable, label, line1, line2, city,
     state, country, lat, lng, isDefault)
   - **LaundryService** (id, businessId FK, name [enum-backed but
     stored as row for per-business customization], description,
     isActive)
   - **Pricing** (id, businessId FK, laundryServiceId FK, unit
     [PerItem/PerKg], basePrice, expressSurchargePercent, currency)
   - **Order** (id, orderNumber [human-readable], customerId FK,
     businessId FK, branchId FK, pickupAddressId FK, deliveryAddressId
     FK, status enum, paymentMethod enum, paymentStatus enum,
     subtotal, deliveryFee, discount, total, currency,
     scheduledPickupAt, scheduledDeliveryAt, isExpress, notes,
     createdAt, updatedAt)
   - **OrderItem** (id, orderId FK, laundryServiceId FK, description,
     quantity, unit, unitPrice, lineTotal, garmentNotes)
   - **Payment** (id, orderId FK, provider [Paystack/Flutterwave/
     Stripe], providerReference, amount, currency, method enum,
     status enum, paidAt, rawPayload JSON)
   - **DispatchTask** (id, orderId FK, riderId FK nullable [null until
     assigned], type enum [Pickup/Delivery], status enum, assignedAt,
     acceptedAt, completedAt, businessId FK — assigned only by
     business, never by rider)
   - **ProofOfDelivery** (id, dispatchTaskId FK, imageUrl, signatureUrl
     nullable, recipientName, notes, capturedAt, lat, lng)
   - **Settlement** (id, riderId FK, businessId FK, periodStart,
     periodEnd, totalJobs, totalAmount, status enum, paidAt,
     reference)
   - **Notification** (id, userId FK, channel enum, title, body,
     data JSON, isRead, sentAt, createdAt)
   - **Rating** (id, orderId FK, customerId FK, riderId FK nullable,
     businessId FK, score 1-5, comment, createdAt)
   - **SupportTicket** (id, userId FK, orderId FK nullable, subject,
     description, status enum, assignedStaffId FK nullable,
     createdAt, resolvedAt)
   - **Promotion** (id, businessId FK, code, description, discountType
     [Percent/Fixed], discountValue, startsAt, expiresAt, usageLimit,
     timesUsed, isActive)
   - **AuditLog** (id, actorUserId FK nullable, action, entityType,
     entityId, beforeState JSON, afterState JSON, ipAddress,
     userAgent, createdAt)

3. RELATIONSHIP RULES TO ENFORCE AT DB LEVEL
   - `DispatchTask.riderId` is nullable and can ONLY be set by a
     business-side mutation (enforce in application layer, but design
     the schema so a rider-only DB role — if used — has no UPDATE grant
     on this column; document as a future defense-in-depth note).
   - Cascade rules: deleting a Business should NOT hard-delete Orders
     (use soft deletes via `deletedAt` on Business, Branch, Order,
     LaundryService, Pricing, Promotion).
   - Add DB-level check constraints: `Order.total >= 0`,
     `Pricing.basePrice >= 0`, `Rating.score BETWEEN 1 AND 5`.
   - Add unique constraints: `User.email`, `User.phone`,
     `Order.orderNumber`, `Promotion.code` (per business).

4. INDEXES
   - Index all FKs.
   - Composite index on `Order(businessId, status)` for operator
     dashboards.
   - Composite index on `DispatchTask(riderId, status)` for rider job
     lists.
   - Index `Order(customerId, createdAt DESC)` for order history.

5. MIGRATIONS & SEEDING
   - Generate the initial Prisma migration.
   - Write a seed script (`prisma/seed.ts`) that creates:
     - Default roles (SuperAdmin, BusinessOwner, Staff, DispatchRider,
       Customer) and a baseline permission set per role, matching the
       PRD's role capabilities exactly (e.g. DispatchRider must NOT get
       `orders:assign_dispatch` or `orders:edit`).
     - One demo Business with a Branch, 3 staff, 3 riders with
       Vehicles, the 10 LaundryServices from the PRD with Pricing, and
       2 demo customers with addresses.
   - Add an npm script `db:seed` and document it in the README.

6. VALIDATION
   - Write a short Prisma schema lint/test that asserts every model has
     `createdAt`/`updatedAt` where mutable, and that soft-deletable
     models have `deletedAt`.

Output: a complete `schema.prisma`, generated migration files, the seed
script, and a `/docs/erd.md` with a Mermaid ER diagram of all entities
and relationships.
```

## Definition of Done

- [ ] `schema.prisma` covers all 20 PRD entities plus Role/Permission/
      AuditLog and supporting enums
- [ ] Migration runs clean on a fresh DB
- [ ] Seed script populates a working demo dataset
- [ ] Mermaid ERD committed to `/docs/erd.md`
- [ ] Unique/check constraints verified with a quick failing-insert test
- [ ] RBAC seed data matches PRD role boundaries (riders can't self-assign, etc.)

Proceed to `phase-03-auth-rbac-security.md`.
