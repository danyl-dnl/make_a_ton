# Temporary finance and payments API interface

No finance API contract or backend endpoints were found in this repository. `src/lib/finance-api.ts` contains provisional routes and response types only. Confirm endpoint paths, date/status filter semantics, response envelopes, payment methods, permissions, and partial-payment behavior with Person A before connecting a backend.

## Proposed routes

| Operation | Proposed route | Expected response |
| --- | --- | --- |
| Finance dashboard | `GET /dashboard/finance?from=&to=&invoiceStatus=&paymentStatus=` | `FinanceDashboard` |
| Payment listing | `GET /payments?from=&to=&status=&q=` | JSON array of `Payment` |
| Payable invoice choices | `GET /invoices/payable` | JSON array of `PaymentInvoiceOption` |
| Record payment | `POST /payments` | `Payment` including backend-reported invoice payment status |
| Invoice payment history | `GET /invoices/:invoiceId/payments` | JSON array of `Payment` |

Models are declared in `src/lib/finance-types.ts`. The dashboard response owns all four KPI values, revenue points, payment counts/amounts, recent and overdue invoice rows, and active-subscription summary rows. The server should apply the requested date and status parameters when calculating its KPIs and aggregates. The UI also filters returned chart/invoice/payment-summary/list rows by the selected filters so the visible rows reflect the current selection.

## Payment rules

The payment entry form uses invoice choices and outstanding amounts returned by the backend. It sends invoice ID, method, amount, date, and note to `POST /payments`; the server must validate amount limits and determine whether the invoice is partially or fully paid. The frontend displays `Payment.invoicePaymentStatus` from the response and never calculates remaining balance or derives the payment state locally. Invoice detail payment history is separately loaded from the backend.

## No sample finance data

Without `VITE_API_BASE_URL`, dashboard, payment, and history calls show loading followed by an API configuration error/empty state. No KPI totals, chart points, invoices, or payments are seeded. Configure the base URL only when actual backend routes and response contracts are available.
