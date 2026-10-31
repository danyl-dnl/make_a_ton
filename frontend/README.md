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

The dashboard links to Products, Plans, Customers, Quotations, and Subscriptions. The sidebar and router also include Invoices, Discounts, Payments, Staff, and Customer Portal. Pages are intentionally presentation-only and contain no backend integration.
