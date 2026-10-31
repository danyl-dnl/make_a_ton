# Temporary quotation and subscription API contract

No `docs/api-contract.md` or quotation/subscription backend endpoints exist in this checkout. `src/lib/commerce-api.ts` therefore contains **proposed routes and data types only**. Confirm route paths, verbs, payloads, response envelopes, authorization, and lifecycle rules with Person A before enabling integration.

## Proposed routes

| Operation | Proposed route | Expected response |
| --- | --- | --- |
| List quotation templates | `GET /quotation-templates` | JSON array of `QuoteTemplate` |
| Create quotation template | `POST /quotation-templates` | `QuoteTemplate` |
| Edit quotation template | `PUT /quotation-templates/:id` | `QuoteTemplate` |
| Delete quotation template | `DELETE /quotation-templates/:id` | `204` |
| List quotations | `GET /quotations` | JSON array of `Quotation` |
| Quotation details | `GET /quotations/:id` | `Quotation` |
| List subscriptions | `GET /subscriptions` | JSON array of `Subscription` |
| Subscription details | `GET /subscriptions/:id` | `Subscription` |
| Confirm | `POST /subscriptions/:id/confirm` | Updated `Subscription` |
| Activate | `POST /subscriptions/:id/activate` | Updated `Subscription` |
| Pause | `POST /subscriptions/:id/pause` | Updated `Subscription` |
| Resume | `POST /subscriptions/:id/resume` | Updated `Subscription` |
| Renew | `POST /subscriptions/:id/renew` | Updated `Subscription` |
| Close | `POST /subscriptions/:id/close` | Updated `Subscription` |

The detail pages expect the fields in `src/lib/commerce-types.ts`. Line tax amounts are currently displayed as `quantity × unit price × tax rate`; confirm inclusive/exclusive tax and rounding behavior with the backend. Dates are rendered in the browser's local timezone and should be aligned with the API's date/time representation.

## Provisional lifecycle model

The UI assumes `pending_confirmation → confirmed → active ↔ paused`, with renew allowed for active or expired records and close allowed for any non-closed status. This is presentation guidance, not enforcement. The API must validate every transition. Lifecycle buttons issue a `POST` and re-fetch the subscription after success; they never mutate status locally. Close is confirmed first. Buttons are disabled until `VITE_API_BASE_URL` is configured.

## Integration dependency

No quotation/subscription mock records or preview source are used. Without a configured API base URL, list/detail requests show an unavailable/error state and mutation requests return a configuration error. Configure a local `.env` only after the service URL and contract are agreed. A configured URL alone does not prove the backend routes are deployed.
