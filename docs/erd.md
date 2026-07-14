# Entity-Relationship Diagram (Phase 2)

This diagram documents the core 20-entity PostgreSQL schema designed for the Laundry Management Platform.

```mermaid
erDiagram
    User ||--o| CustomerProfile : "has"
    User ||--o| StaffProfile : "has"
    User ||--o| DispatchRiderProfile : "has"
    User ||--o{ Notification : "receives"
    User ||--o{ Address : "owns"

    Role ||--o{ RolePermission : "has"
    Permission ||--o{ RolePermission : "has"
    Role ||--o{ StaffProfile : "assigns"

    Business ||--o{ Branch : "has"
    Business ||--o{ StaffProfile : "employs"
    Business ||--o{ DispatchRiderProfile : "employs"
    Business ||--o{ LaundryService : "offers"
    Business ||--o{ Pricing : "sets"
    Business ||--o{ Promotion : "creates"
    Business ||--o{ Order : "manages"

    Address ||--o{ Branch : "located at"
    Address ||--o{ Order : "pickup/delivery"

    LaundryService ||--o{ Pricing : "has"
    LaundryService ||--o{ OrderItem : "used in"

    Order ||--o{ OrderItem : "contains"
    Order ||--o{ Payment : "paid via"
    Order ||--o{ DispatchTask : "requires"
    Order ||--o{ Rating : "receives"
    Order ||--o{ SupportTicket : "referenced in"

    DispatchRiderProfile ||--o| Vehicle : "drives"
    DispatchTask ||--o| ProofOfDelivery : "generates"
    DispatchRiderProfile ||--o{ Settlement : "receives"
    DispatchRiderProfile ||--o{ DispatchTask : "performs"

    CustomerProfile ||--o{ Order : "places"
    CustomerProfile ||--o{ Rating : "gives"
```

## Key Polymorphism Approach

- **Users** represent the identity base (`User` table with credentials and `userType`).
- Roles are segregated into specific profile tables: `CustomerProfile`, `StaffProfile`, and `DispatchRiderProfile`.
- A Business Owner is a `User` linked directly to a `Business` entity.

## RBAC Design

- Custom roles are assigned via `Role` and checked against `RolePermission`.
- A rider is inherently a `DispatchRiderProfile`, whereas a backend operator is a `StaffProfile` with an attached `Role`.
