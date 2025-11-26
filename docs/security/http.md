# HTTP surface hardening

This release adds strict defaults for headers, CORS, and webhook verification across the app router.

## Default security headers

All responses now include a shared set of headers applied in `middleware.ts`:

- `X-Content-Type-Options: nosniff` – prevent MIME sniffing.
- `Referrer-Policy: strict-origin-when-cross-origin` – limit downstream leakage of URLs.
- `X-Frame-Options: DENY` – block clickjacking. If an embed is required later, switch to `SAMEORIGIN` in the middleware.
- `Permissions-Policy` – camera, microphone, payment request, and related sensors are disabled by default. Expand only when a route genuinely needs hardware access.
- `Strict-Transport-Security` – enabled only in production to enforce HTTPS for a year (with subdomains). Disabled locally to avoid conflicts with plain HTTP dev servers.

These headers are set for every matched route; asset paths under `/_next`, `/favicon.ico`, and `/robots.txt` remain untouched.

## CORS rules

CORS is opt-in and origin-restricted for `/api/*` routes. Allowed origins:

- `https://portaprosoftware.com`
- Any `https://*.portaprosoftware.com` subdomain
- Local development convenience: `http://localhost` (non-production only)

Behavior:

- Preflight (`OPTIONS`) requests without an allowed origin receive `403`.
- Allowed origins receive `Access-Control-Allow-Origin` echoing the origin plus explicit method/header lists. Wildcards are never used.
- Requests without an `Origin` header proceed as same-origin.

To extend the allowlist, update `isAllowedCorsOrigin` in `middleware.ts` with the new hostname(s).

## Webhook verification

Two webhook handlers now enforce HMAC validation before any processing:

- **Stripe:** `/api/webhooks/stripe`
  - Uses the `Stripe-Signature` header (`t` + `v1` components) and compares against a SHA-256 HMAC of `"{timestamp}.{rawBody}"` using `STRIPE_WEBHOOK_SECRET`.
  - Rejects missing/invalid signatures with `401`, timestamps older than five minutes, or missing secrets with `500`.
- **Clerk:** `/api/webhooks/clerk`
  - Validates `svix-timestamp` + `svix-signature` headers. Signatures are recomputed as a base64 SHA-256 HMAC of `"{timestamp}.{rawBody}"` using the decoded `CLERK_WEBHOOK_SECRET` (strip the `whsec_` prefix first).
  - Rejects missing/invalid signatures with `401` and enforces the same five-minute tolerance.

Both handlers log the event type/id and return `{ received: true }` on success. Configure secrets through environment variables (server-only); missing secrets respond with `500` to avoid silently accepting unverified webhooks.
