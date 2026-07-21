# Notifications System

The notifications system in Savi is an event-driven architecture that responds to domain events and dispatches notifications via multiple channels: Push, Email, SMS, and In-App.

## Architecture

1. **Event Emission:** 
   Domain modules (Orders, Payments, Dispatch, Support) emit events using `@nestjs/event-emitter`. Example: `order.status_changed`.
   
2. **Event Subscriber (`NotificationEventSubscriber`):** 
   Listens for these events. Based on the event, it defines the `category`, `title`, `body`, and default `channels` (e.g., Push, In-App, Email). It checks user preferences (`NotificationPreference`) to respect opt-outs, then pushes a job to the `notifications` BullMQ queue.
   
3. **Queue Processor (`NotificationQueueProcessor`):**
   Picks up jobs from BullMQ. Iterates over the selected channels and calls the corresponding sender:
   - `FcmPushSender` (Firebase Cloud Messaging)
   - `SendGridEmailSender` (SendGrid)
   - `TwilioSmsSender` (Twilio)
   - It also saves the notification to the `Notification` table for In-App display.

4. **WebSockets Gateway (`NotificationsGateway`):**
   Listens to the same domain events and broadcasts live updates directly to active, authenticated Socket.IO clients.

## Notification Categories & Default Channels

| Event | Category | Channels | Description |
|-------|----------|----------|-------------|
| `order.status_changed` | OrderUpdates | Push, In-App, Email | When an order transitions states (e.g., Pending -> Accepted). |
| `dispatch.task_assigned` | Dispatch | Push, In-App | When a driver is assigned a new delivery. |
| `payment.confirmed` / `failed` | Payments | Push, In-App, Email | When a payment succeeds or fails. |
| `settlement.processed` | Settlements | Push, In-App, Email | When a business settlement is completed. |
| `support.ticket_created` / `resolved` | Support | Push, In-App, Email | When a support ticket status changes. |

## Managing Preferences

Users can opt-out of specific categories (e.g., `OrderUpdates` via `Email`). This is handled via the `PATCH /notifications/preferences` endpoint. Opt-outs are evaluated before enqueuing to BullMQ.

## Real-Time Updates

Socket.IO clients should connect to the `/notifications` namespace with their JWT token.
```javascript
const socket = io('http://api-url/notifications', {
  query: { token: 'JWT_TOKEN_HERE' }
});

socket.on('orderStatusChanged', (data) => {
  console.log('Order status updated:', data);
});
```
