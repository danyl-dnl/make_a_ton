# API Contract & Specifications Document
**Project:** Brightloop Software — Subscription Management System (SubscriptIQ)  
**API Protocol:** RESTful over HTTP/2 & JSON  
**API Specification Standard:** OpenAPI 3.1 / RFC 7807  
**Base URL:** `http://localhost:8000/api`  
**Current Release Version:** `v0.1.0`  

---

## 1. Overview & General Standards

### 1.1. Content-Type and Encodings
- All incoming requests containing payloads must specify `Content-Type: application/json`.
- All outgoing responses are serialized with `Content-Type: application/json; charset=utf-8`.
- Date and timestamp values follow ISO 8601 UTC representation: `YYYY-MM-DDTHH:MM:SSZ`.

### 1.2. Authentication & Security
- **Mechanism:** HTTP Bearer Authentication with JSON Web Tokens (JWT).
- **Header:** `Authorization: Bearer <access_token>`
- **RBAC Roles:** `admin`, `billing_manager`, `viewer`, `customer`.

### 1.3. Standard Error Envelope (RFC 7807 Problem Details)
When an endpoint encounters a validation error, domain error, or internal fault:
```json
{
  "type": "https://api.brightloop.io/errors/validation-error",
  "title": "Unprocessable Entity",
  "status": 422,
  "detail": "Input payload failed validation rules.",
  "errors": [
    {
      "field": "customer_id",
      "message": "Field 'customer_id' must be a valid UUIDv4"
    }
  ],
  "instance": "/api/v1/subscriptions"
}
```

---

## 2. Core Foundation Endpoints

### 2.1. System & Database Health Check
Validates application runtime readiness and executes an active round-trip probe to the PostgreSQL database.

- **Method:** `GET`
- **Path:** `/api/health`
- **Authentication:** Public (No token required)

#### Success Response (`200 OK`)
```json
{
  "status": "healthy",
  "app_name": "Brightloop Subscription Management System",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "status": "connected",
    "latency_ms": 1.45,
    "error": null
  }
}
```

#### Degraded / Failure Response (`503 Service Unavailable`)
```json
{
  "status": "unhealthy",
  "app_name": "Brightloop Subscription Management System",
  "version": "0.1.0",
  "environment": "development",
  "database": {
    "status": "disconnected",
    "latency_ms": null,
    "error": "connection to server at 'localhost', port 5432 failed: Connection refused"
  }
}
```

---

## 3. Subscription Domain Endpoints (API v1 Roadmap)

### 3.1. Customer Management (`/api/v1/customers`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/v1/customers` | Register a new customer billing profile | `admin`, `billing_manager` |
| `GET` | `/api/v1/customers` | List paginated customer profiles with filters | `admin`, `billing_manager`, `viewer` |
| `GET` | `/api/v1/customers/{id}` | Retrieve individual customer details | `admin`, `billing_manager`, `customer` |
| `PATCH` | `/api/v1/customers/{id}` | Update billing details or payment preferences | `admin`, `billing_manager` |

#### Payload: `POST /api/v1/customers`
```json
{
  "name": "Acme Corporation",
  "email": "billing@acme.com",
  "phone": "+1-555-0199",
  "currency": "USD",
  "tax_id": "US-123456789",
  "billing_address": {
    "line1": "100 Innovation Way",
    "city": "Austin",
    "state": "TX",
    "postal_code": "78701",
    "country": "US"
  }
}
```

---

### 3.2. Product & Plan Catalog (`/api/v1/products`)
| Method | Endpoint | Description | Roles |
|---|---|---|---|
| `POST` | `/api/v1/products` | Create a new catalog product | `admin` |
| `GET` | `/api/v1/products` | List active products and plan tiers | Public / Authenticated |
| `POST` | `/api/v1/products/{product_id}/plans` | Create a pricing plan under a product | `admin` |

#### Payload: `POST /api/v1/products/{product_id}/plans`
```json
{
  "name": "Enterprise Annual",
  "code": "ENT-ANNUAL",
  "billing_interval": "annual",
  "billing_interval_count": 1,
  "price_cents": 120000,
  "currency": "USD",
  "trial_period_days": 14,
  "pricing_model": "flat_fee"
}
```

---

### 3.3. Subscription Lifecycle (`/api/v1/subscriptions`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/subscriptions` | Initialize and activate a new subscription |
| `GET` | `/api/v1/subscriptions` | Query subscriptions by status, customer, date range |
| `GET` | `/api/v1/subscriptions/{id}` | Retrieve subscription state and billing intervals |
| `POST` | `/api/v1/subscriptions/{id}/pause` | Pause recurring invoicing |
| `POST` | `/api/v1/subscriptions/{id}/resume` | Resume subscription billing |
| `POST` | `/api/v1/subscriptions/{id}/cancel` | Cancel subscription (immediate or at period end) |
| `POST` | `/api/v1/subscriptions/{id}/upgrade` | Change plan tier with proration calculation |

#### Payload: `POST /api/v1/subscriptions`
```json
{
  "customer_id": "b3e944b2-0310-449e-b2d9-e31464c8bc23",
  "plan_id": "7b048d28-09cb-4c22-b5e1-0c58e11a3db6",
  "quantity": 5,
  "start_date": "2026-11-01T00:00:00Z",
  "apply_trial": true,
  "coupon_code": "BLACKFRIDAY20"
}
```

#### Success Response (`201 Created`):
```json
{
  "id": "e441c884-6fb0-4543-982d-e4aa3bf872e1",
  "customer_id": "b3e944b2-0310-449e-b2d9-e31464c8bc23",
  "plan_id": "7b048d28-09cb-4c22-b5e1-0c58e11a3db6",
  "status": "trialing",
  "quantity": 5,
  "trial_start": "2026-11-01T00:00:00Z",
  "trial_end": "2026-11-15T00:00:00Z",
  "current_period_start": "2026-11-15T00:00:00Z",
  "current_period_end": "2027-11-15T00:00:00Z",
  "created_at": "2026-10-31T12:00:00Z"
}
```

---

### 3.4. Quotations & Conversion (`/api/v1/quotations`)
| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/v1/quotations` | Generate formal customer quote proposal |
| `GET` | `/api/v1/quotations/{id}` | Inspect quotation itemization |
| `POST` | `/api/v1/quotations/{id}/convert` | Accept and instantiate active subscription from quote |

---

### 3.5. Invoices & Billing Reconciliation (`/api/v1/invoices`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/invoices` | List invoices with paid/pending status filters |
| `GET` | `/api/v1/invoices/{id}` | Retrieve line-item breakdown and PDF download link |
| `POST` | `/api/v1/invoices/{id}/pay` | Trigger payment execution against registered payment gateway |

---

### 3.6. Payment Webhook Ingestion (`/api/v1/webhooks/{gateway}`)
- **Path:** `/api/v1/webhooks/stripe`, `/api/v1/webhooks/razorpay`
- **Security:** HMAC cryptographic signature verification (`Stripe-Signature` or `X-Razorpay-Signature`).
- **Events:**
  - `invoice.paid`: Mark invoice as `paid` and extend `current_period_end`.
  - `invoice.payment_failed`: Mark invoice as `past_due`, enter dunning workflow, emit alert.
  - `customer.subscription.deleted`: Transition subscription status to `canceled`.

---

## 4. HTTP Status Code Conventions

| Code | Status | Meaning |
|---|---|---|
| `200` | OK | Successful retrieval or synchronous operation. |
| `201` | Created | Resource successfully created. |
| `204` | No Content | Successful operation with empty body (e.g., delete/cancel). |
| `400` | Bad Request | Syntactically invalid request or failed domain assertion. |
| `401` | Unauthorized | Missing or expired JWT bearer credentials. |
| `403` | Forbidden | Insufficient permissions for tenant or role. |
| `404` | Not Found | Requested entity does not exist. |
| `409` | Conflict | Duplicate unique key (e.g., email or slug already registered). |
| `422` | Unprocessable Entity | Pydantic schema validation failure. |
| `500` | Internal Server Error | Unhandled server error. |
| `503` | Service Unavailable | Database or required downstream dependency connection failure. |
