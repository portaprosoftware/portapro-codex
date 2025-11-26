# Environment configuration

The app validates required environment variables at boot using `zod`. Missing or malformed values will stop the server or build immediately with a clear error.

## Required variables

| Name | Scope | Example |
| --- | --- | --- |
| `SUPABASE_URL` | server & client | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | server & client | `public-anon-key` |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | `service-role-key` |
| `CLERK_SECRET_KEY` | server-only | `sk_test_xxx` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | client | `pk_test_xxx` |
| `NEXT_PUBLIC_ROOT_DOMAIN` | client | `portaprosoftware.com` |
| `NEXT_PUBLIC_MARKETING_URL` | client | `https://portaprosoftware.com` |
| `NEXT_PUBLIC_APP_ROOT_URL` | client | `https://app.portaprosoftware.com` |

> **Note:** `SUPABASE_SERVICE_ROLE_KEY` and `CLERK_SECRET_KEY` must never be exposed to the browser. Keep them in server-only runtime configuration.

## Optional variables

These remain optional but can be added alongside the required keys:

- `VITE_MAPBOX_TOKEN`
- `VITE_POSTHOG_KEY`
- `VITE_SENTRY_DSN`
- `VITE_GA_MEASUREMENT_ID`
- `VITE_ALLOWED_CLERK_ORG_SLUGS`
- `VITE_ENABLE_SERVICE_WORKER`

## Example `.env`

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=public-anon-key
SUPABASE_SERVICE_ROLE_KEY=service-role-key
CLERK_SECRET_KEY=sk_test_xxx
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
NEXT_PUBLIC_ROOT_DOMAIN=portaprosoftware.com
NEXT_PUBLIC_MARKETING_URL=https://portaprosoftware.com
NEXT_PUBLIC_APP_ROOT_URL=https://app.portaprosoftware.com
```
