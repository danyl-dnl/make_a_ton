# Temporary authentication API interface

`docs/api-contract.md` is not present in this repository as of 2026-10-31. This frontend uses a temporary typed adapter in `src/lib/api.ts`. Its endpoint paths, request bodies, response types, and token strategy are proposals only; **confirm them with Person A** and replace them with the agreed contract before backend integration.

| Operation | Temporary request | Temporary response |
| --- | --- | --- |
| Login | `POST /auth/login` `{ email, password }` | `{ accessToken, refreshToken?, user }` |
| Customer registration | `POST /auth/register` `{ name, email, password }` | `{ accessToken, refreshToken?, user }` |
| Forgot password | `POST /auth/forgot-password` `{ email }` | `204` or JSON |
| Reset password | `POST /auth/reset-password` `{ token, password }` | `204` or JSON |

Set `VITE_API_BASE_URL` in a local `.env` file when the backend URL is known. Until that is configured, submissions return an explicit service-not-configured error. Auth responses are not stored and the UI does not establish a session; agree on cookie/token handling, email verification, response envelopes, rate limits, and error semantics with Person A first.
