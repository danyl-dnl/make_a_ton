# Brightloop frontend

A React + TypeScript subscription management workspace scaffold built with Vite, Tailwind CSS v4, React Router, and local shadcn-style UI primitives.

## Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Vite prints the local development URL after startup. To create a production build, run `npm run build`.

## Structure

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
└── src/
    ├── App.tsx                    # Route declarations
    ├── main.tsx                   # React entry point and router provider
    ├── styles.css                 # Tailwind import and global design tokens
    ├── components/
    │   ├── layout/
    │   │   ├── AppLayout.tsx      # Sidebar + header application shell
    │   │   ├── Header.tsx         # Top bar and account actions
    │   │   ├── PageContainer.tsx  # Shared page heading and content frame
    │   │   └── Sidebar.tsx        # Desktop and mobile navigation
    │   └── ui/
    │       ├── button.tsx         # Typed button variants
    │       └── card.tsx           # Card building blocks
    ├── lib/
    │   └── utils.ts               # Class name merging helper
    └── pages/
        ├── DashboardPage.tsx      # Navigation-oriented landing page (no fabricated metrics)
        └── PlaceholderPage.tsx   # Reusable section placeholder
```

The dashboard links to Products, Plans, Customers, Quotations, and Subscriptions. The sidebar and router also include Invoices, Discounts, Payments, Staff, and Customer Portal. Products and Plans have catalog management screens. Other sections remain presentation-only.

## Authentication UI and shared components

The frontend also includes responsive sign-in, customer registration, forgot password, and reset password routes at `/login`, `/register`, `/forgot-password`, and `/reset-password`. Shared primitives include `FormField`, `DataTable`, `StatePanel`, `Modal`, and `ConfirmDialog`. Password validation is centralized in `src/lib/validation.ts`.

The backend API contract is not present yet. The typed adapter in `src/lib/api.ts` is explicitly temporary; see `docs/auth-api-temporary.md` and confirm endpoint paths, payloads, response envelopes, and session handling with Person A before integrating it. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL` when the backend endpoint is agreed. Auth responses are not persisted and no fake session is created.

Product and plan screens use `src/lib/catalog-service.ts`. Since no catalog API contract or endpoints are ready in this repository, the default source is a clearly labeled, empty, memory-only preview adapter in `src/lib/catalog-preview.ts`; its records disappear on reload. Proposed API routes are isolated in `src/lib/catalog-api.ts` and documented in `docs/catalog-api-temporary.md`. Confirm routes and data shapes with Person A before enabling a backend URL. Do not rely on preview records for actual catalog data.

Quotation templates, quotation list/detail, and subscription list/detail use the centralized `src/lib/commerce-api.ts` adapter. No backend contract or fake records are supplied. The provisional routes, response assumptions, and status transitions are documented in `docs/commerce-api-temporary.md`; confirm them with Person A before connecting. Subscription lifecycle actions are disabled until an API base URL is configured, call backend endpoints when enabled, and re-fetch server state after successful requests.

Invoice and discount screens use `src/lib/billing-api.ts`. No sample invoice amounts, discount usage counts, or local billing records are used. Invoice totals are backend-owned display values; see `docs/billing-api-temporary.md` for proposed endpoints, response fields, and integration questions. Invoice send is exposed only when the detail response declares `capabilities.send === true`.

The finance dashboard and payment management UI use Recharts and the centralized `src/lib/finance-api.ts` adapter. Dashboard KPIs, chart points, invoice rows, subscription summary, payments, and partial/full invoice payment states are backend-owned. No finance sample data is included. See `docs/finance-api-temporary.md` for provisional endpoints, response shapes, filtering requirements, and payment rules. Confirm the contract with Person A before setting the API base URL.
