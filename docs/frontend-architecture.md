# Frontend Architecture

This document describes the frontend architecture for the Savi platform. The frontend ecosystem consists of three distinct Flutter applications that share a common Dart core package.

## 1. Structure
- `apps/customer`: Mobile app for Customers.
- `apps/dispatch`: Mobile app for Dispatch Riders.
- `apps/business_web`: Web dashboard for Business Operators.
- `packages/core`: Shared logic, models, design tokens, and HTTP API clients.

## 2. Core Package (`packages/core`)
The shared core contains business logic and entities that are identical across all interfaces. By extracting this into `packages/core`, we ensure a single source of truth.

### Included in Core
- **Models**: `User`, `Order`, `Business`, `NotificationPreference`.
- **API Client**: A shared HTTP client (`ApiClient`) that handles JWT authorization interception and central error handling.
- **Design Tokens**: Standardized colors (`SaviColors`), typography (`SaviTypography`), and spacing (`SaviSpacing`) to keep brand guidelines intact.

## 3. Applications

### Customer App
- **Goal**: Allow users to place orders, track dispatch status, and manage their profile.
- **Key Features**: Onboarding, Home Screen, Order Tracking Map.

### Dispatch App
- **Goal**: Allow dispatch riders to see assigned jobs and confirm pickups/deliveries.
- **Key Features**: Login (Dispatches cannot create accounts; they are created by the Business), Job List, Proof of Delivery (Photo/Signature).

### Business Web Dashboard
- **Goal**: Web interface for business operators to control everything. 
- **Key Features**: Orders Board, Fleet Management, Analytics, Customer List.

## 4. State Management & Navigation
- We recommend using `flutter_riverpod` for dependency injection and state management across all apps.
- For complex routing, `go_router` is ideal, particularly for `business_web` to support deep linking.

## 5. Security & RBAC
The backend enforces Role-Based Access Control (RBAC). The frontend apps should merely adapt their UI based on the current user's role (Customer vs. Dispatch vs. Super Admin), but never rely on client-side state for security guarantees.
