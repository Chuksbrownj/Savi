# Order Status Flow

The following state machine diagram illustrates the valid order statuses and transitions within the Savi application. This workflow engine is governed by the `OrderWorkflowService`.

```mermaid
stateDiagram-v2
    [*] --> Draft: Customer Creates Order

    Draft --> AwaitingPayment: Submit Order
    Draft --> Cancelled: Customer Cancels

    AwaitingPayment --> PaymentConfirmed: Payment Success
    AwaitingPayment --> Cancelled: Customer/System Cancels

    PaymentConfirmed --> AwaitingPickupAssignment: Business Approves
    PaymentConfirmed --> Cancelled: Business/System Cancels

    AwaitingPickupAssignment --> PickupAssigned: Business Assigns Rider
    AwaitingPickupAssignment --> Cancelled: Business/System Cancels

    PickupAssigned --> PickupInProgress: Rider Starts Job
    PickupAssigned --> Cancelled: Business/System Cancels

    PickupInProgress --> LaundryReceived: Rider Completes Pickup
    PickupInProgress --> Cancelled: Business/System Cancels

    LaundryReceived --> Sorting: Processing Starts
    LaundryReceived --> ReadyForDelivery: Skip Processing
    LaundryReceived --> Cancelled: Business/System Cancels

    Sorting --> Washing: Next Stage
    Sorting --> Cancelled: Business/System Cancels

    Washing --> Drying: Next Stage
    Washing --> Cancelled: Business/System Cancels

    Drying --> Ironing: Next Stage
    Drying --> Cancelled: Business/System Cancels

    Ironing --> Packaging: Next Stage
    Ironing --> Cancelled: Business/System Cancels

    Packaging --> ReadyForDelivery: Packaging Complete
    Packaging --> Cancelled: Business/System Cancels

    ReadyForDelivery --> DeliveryAssigned: Business Assigns Rider
    ReadyForDelivery --> Cancelled: Business/System Cancels

    DeliveryAssigned --> OutForDelivery: Rider Starts Job
    DeliveryAssigned --> Cancelled: Business/System Cancels

    OutForDelivery --> Delivered: Rider Completes Delivery
    OutForDelivery --> Cancelled: Business/System Cancels

    Delivered --> Completed: Customer Confirms Receipt / System Auto-Completes (48h)
    Delivered --> Cancelled: Business/System Cancels

    Completed --> [*]
    Cancelled --> [*]
```

## Implementation Details

- **Transitions Engine**: `OrderWorkflowService` enforces transitions.
- **Rules Mapping**: Located in `transitions` array in `OrderWorkflowService`.
- **Side Effects**: Side effects such as auditing and timeline events are built directly into the workflow transition service.
- **Actor Enforcement**: The transition rules are bound by `ActorType` (`Customer`, `BusinessOwner`, `Staff`, `DispatchRider`, `System`).
- **Legacy Compatibility**: Transitions persist to `OrderStatusHistory` table (new) as well as the `OrderTimeline` table (legacy).
