# Temporary product and plan API interface

No product or plan API contract was found in the repository when these screens were implemented. The frontend therefore keeps proposed API endpoints in `src/lib/catalog-api.ts`, behind `src/lib/catalog-service.ts`, and uses a visibly labeled memory-only preview adapter until an API base URL is configured. **These routes and shapes are provisional: confirm them with Person A and replace them with the agreed contract.**

| Operation | Proposed route | Proposed payload |
| --- | --- | --- |
| List products | `GET /products` | JSON array of `Product` |
| Create product | `POST /products` | `ProductInput` |
| Update product | `PUT /products/:id` | `ProductInput` |
| Delete product | `DELETE /products/:id` | `204` |
| List plans | `GET /plans` | JSON array of `Plan` |
| Create plan | `POST /plans` | `PlanInput` |
| Update plan | `PUT /plans/:id` | `PlanInput` |
| Delete plan | `DELETE /plans/:id` | `204` |

The frontend types are in `src/lib/catalog-types.ts`. Confirm whether list results are plain arrays or wrapped, the server-side validation rules, product variant ownership and price semantics, currency precision, plan availability timezone rules, auto-close meaning, renewal behavior, and delete constraints before connecting these proposed routes.

## Preview behavior

Without `VITE_API_BASE_URL`, the catalog service uses `catalog-preview.ts`. It starts with empty collections and keeps created/edited/deleted entries only in JavaScript memory until reload or tab close. The interface displays a temporary preview notice. It does not persist to browser storage or the backend. Once the backend is ready, configure the URL and replace the proposed route and payload definitions with the agreed contract.
