# Environment Variables Reference

This document describes all environment variables used in PortaPro and how to configure them for multi-tenant deployments.

## 🌐 Architecture Overview

PortaPro is designed as a **multi-tenant, reusable codebase**. All tenant-specific configuration is injected via environment variables at runtime. The same GitHub repository can power dozens or hundreds of independent deployments.

### Variable Naming Convention

- **`VITE_*`** → Public variables exposed to the browser (client-side)
- **No prefix** → Server-only variables (API keys, secrets)

---

## 📋 Required Variables

### Client-Side (Public)

These variables are **required** and will cause the app to fail at startup if missing.

| Variable | Where to Get It | Purpose |
|----------|----------------|---------|
| `VITE_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys | Authentication provider public key |
| `VITE_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API | Database URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase Dashboard → Settings → API → `anon` key | Database anonymous key |

#### 🔐 Multi-Tenant Security

**`VITE_ALLOWED_CLERK_ORG_SLUGS`** *(Required for production, optional for dev)*
- **Purpose**: Comma-separated list of Clerk Organization slugs allowed to access this deployment
- **Example**: `abc-rentals,smith-rentals` or `acme-corp`
- **How to get it**: Clerk Dashboard → Organizations → [Your Org] → Settings → Organization slug
- **Critical**: Without this in production, the app will block all access
- **Dev mode**: If empty, all users are allowed for convenience
- **Security**: Ensures users can only log in to deployments where they belong to the authorized organization(s)

### Server-Side (Secret)

These variables are required for server-side operations (edge functions, API routes).

| Variable | Where to Get It | Purpose |
|----------|----------------|---------|
| `CLERK_SECRET_KEY` | Clerk Dashboard → API Keys | Server-side auth verification |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → `service_role` key | Admin database operations |

---

## 🔧 Optional Variables

### Client-Side (Public)

| Variable | Default Behavior | Where to Get It | Purpose |
|----------|------------------|----------------|---------|
| `VITE_APP_URL` | Uses `window.location.origin` | N/A - set to your domain | Base URL for redirects/emails |
| `VITE_MAPBOX_TOKEN` | Falls back to edge function | [Mapbox Account](https://account.mapbox.com/access-tokens/) | Map rendering |
| `VITE_POSTHOG_KEY` | Analytics disabled | [PostHog Dashboard](https://posthog.com) | Product analytics |
| `VITE_SENTRY_DSN` | Error tracking disabled | [Sentry Dashboard](https://sentry.io) | Error monitoring |
| `VITE_GA_MEASUREMENT_ID` | Google Analytics disabled | [Google Analytics](https://analytics.google.com) | Web analytics |

### Server-Side (Secret)

| Variable | Default Behavior | Where to Get It | Purpose |
|----------|------------------|----------------|---------|
| `STRIPE_SECRET_KEY` | Payments disabled | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) | Payment processing |
| `STRIPE_WEBHOOK_SECRET` | Webhooks fail | Stripe → Developers → Webhooks | Webhook signature verification |
| `RESEND_API_KEY` | Email disabled | [Resend Dashboard](https://resend.com/api-keys) | Transactional email |
| `TWILIO_ACCOUNT_SID` | SMS disabled | [Twilio Console](https://console.twilio.com) | SMS messaging |
| `TWILIO_AUTH_TOKEN` | SMS disabled | Twilio Console | SMS auth token |
| `OPENAI_API_KEY` | AI features disabled | [OpenAI Platform](https://platform.openai.com/api-keys) | AI/ML features |

---

## 🚀 Deployment Guide

### Vercel Deployment

1. **Fork/clone this repository**
2. **Import to Vercel**
3. **Set environment variables** in Vercel Dashboard:
   - Go to: Project → Settings → Environment Variables
   - Add all required `VITE_*` variables (applies to all environments)
   - Add all required server-only variables (keep separate per environment if needed)

4. **Deploy**

### Environment-Specific Configuration

For multi-environment setups (dev, staging, prod):

- **Development**: Use `.env.local` (git-ignored) for local overrides
- **Preview**: Set in Vercel → Preview environment variables
- **Production**: Set in Vercel → Production environment variables

---

## 🔒 Security Best Practices

### ✅ DO

- Keep `.env` and `.env.local` in `.gitignore`
- Use `VITE_*` prefix for client-safe variables only
- Store all secrets in Vercel environment settings
- Rotate keys regularly
- Use `pk_live_*` Clerk keys in production
- Use separate Supabase projects for dev/staging/prod

### ❌ DON'T

- Commit real credentials to the repository
- Use `NEXT_PUBLIC_*` prefix (this is a Vite app)
- Mix server secrets with client variables
- Hard-code API keys or URLs in source code
- Share service role keys with the browser

---

## 🛠️ Troubleshooting

### "Missing required client environment variables"

**Cause**: Required `VITE_*` variables not set in Vercel or `.env`

**Fix**: Add the missing variables to Vercel → Settings → Environment Variables

### "Mapbox map not loading"

**Cause**: `VITE_MAPBOX_TOKEN` not set and edge function fallback failed

**Fix**: Add `VITE_MAPBOX_TOKEN` to environment variables or ensure `get-mapbox-token` edge function is deployed

### "Clerk authentication failing"

**Cause**: Using wrong Clerk key format or missing `CLERK_SECRET_KEY` on server

**Fix**: 
- Client uses `VITE_CLERK_PUBLISHABLE_KEY` (starts with `pk_live_` or `pk_test_`)
- Server uses `CLERK_SECRET_KEY` (starts with `sk_live_` or `sk_test_`)

### Bundle size warnings

**Cause**: Heavy libraries (PDF, maps, charts) being statically imported

**Fix**: This should not happen if following the guidelines. Run `pnpm build` and check for violations of `no-restricted-imports` ESLint rule.

---

## 📊 Validation

Run this in your browser console to check loaded environment:

```javascript
import { env } from './env.client';
console.table(env);
```

Expected output should show all required variables populated.

---

## 🔄 Migration from Legacy Setup

If migrating from an older codebase:

1. Replace all `NEXT_PUBLIC_*` with `VITE_*`
2. Update imports from `process.env.*` to `import { env } from '@/env.client'`
3. Move server-only keys from `VITE_*` to non-prefixed names
4. Update Vercel environment variables to match new naming

---

## 📞 Support

For tenant-specific configuration assistance, contact your PortaPro implementation team.
