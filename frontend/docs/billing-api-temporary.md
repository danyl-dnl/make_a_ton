# Temporary invoice and discount API contract

No `docs/api-contract.md` or invoice/discount backend routes were found in this repository when these screens were built. `src/lib/billing-api.ts` contains proposed routes and response types only. Confirm the contract with Person A and replace these assumptions with the server's actual route names, payloads, envelopes, and capability behavior before connecting.

## Proposed routes

| Operation | Proposed route | Expected response |
| --- | --- | --- |
| Invoice list | `GET /invoices` | JSON array of `Invoice` |
| Invoice details | `GET /invoices/:id` | `Invoice` |
| Confirm invoice | `POST /invoices/:id/confirm` | Updated `Invoice` |
| Cancel invoice | `POST /invoices/:id/cancel` | Updated `Invoice` |
| Send invoice | `POST /invoices/:id/send` | Updated `Invoice` |
| Discount list | `GET /discounts` | JSON array of `Discount` |
| Create discount | `POST /discounts` | `Discount` |
| Edit discount | `PUT /discounts/:id` | `Discount` |
| Eligible discount targets | `GET /discount-targets` | JSON array of product/subscription targets |

`Invoice` response types are in `src/lib/billing-types.ts`. The UI displays `subtotal`, each discount amount, each tax amount, each line `amount`, and `total` directly from the API response. It does not derive or overwrite the payable total. Confirm whether line and total values are inclusive of tax, rounding/precision rules, currency semantics, and whether applied discounts are reported before or after tax.

Invoice send is rendered only when `Invoice.capabilities.send === true` in the detail response. Confirm whether the backend exposes this capability field or choose another documented capability mechanism. Confirmation and cancellation status changes are never applied optimistically; the UI re-fetches the invoice after a successful action. Cancellation always requires user confirmation.

Discount usage counts, status, and target lists are expected to be backend-owned. `usageCount` is read-only in the UI. Product/subscription target selection expects a `GET /discount-targets` result shaped as `{ id, name, type }` with `type` equal to `product` or `subscription`.

## No temporary business records

There are no invoice or discount preview records and no local persistence. Without `VITE_API_BASE_URL`, list/detail calls show an unavailable state, save/action calls return a configuration error, and no example amounts or usage counts are displayed.
