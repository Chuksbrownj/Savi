# API Documentation

The Savi API is built with NestJS and provides RESTful endpoints.

## Base URL
- **Local:** `http://localhost:3000/api/v1`
- **Production:** `https://your-savi-api.vercel.app/api/v1`

## Authentication
Most endpoints require a Bearer token:
`Authorization: Bearer <your-access-token>`

## OpenAPI (Swagger) Specification
The API exposes a comprehensive OpenAPI UI detailing all routes, request bodies, and responses.
- **URL:** `/api/docs`

## Core Modules

### 1. Identity & Auth (`/auth`)
- `POST /auth/register`: Register a new user.
- `POST /auth/login`: Authenticate and receive JWT tokens.
- `POST /auth/refresh`: Refresh JWT tokens.

### 2. Orders (`/orders`)
- `POST /orders`: Create a new laundry order.
- `GET /orders`: List orders (filtered by user/business context).
- `GET /orders/:id`: Get order details.
- `PATCH /orders/:id/status`: Update order status.

### 3. Business Management (`/businesses`)
- `POST /businesses`: Register a laundry business.
- `GET /businesses/:id`: Get business details.

### 4. Dispatch Riders (`/dispatch`)
- `GET /dispatch/assigned`: View assigned orders.
- `PATCH /dispatch/:id/pickup`: Mark an order as picked up.
- `PATCH /dispatch/:id/deliver`: Mark an order as delivered.

### 5. Webhooks (`/webhooks/qstash`)
These endpoints are secured by Upstash signature verification and should not be called directly by clients.
- `POST /webhooks/qstash/notifications`: Process asynchronous notifications (email, sms).
- `POST /webhooks/qstash/orders`: Auto-completion or delayed order actions.
- `POST /webhooks/qstash/business`: Generate analytics reports.

## Rate Limiting & Security
- Default rate limit: 1000 requests per 60 seconds per IP.
- Helmet is enabled to set appropriate HTTP security headers.
