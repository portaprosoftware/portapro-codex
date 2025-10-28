# PortaPro Deployment Guide

Complete guide for deploying PortaPro across multiple environments using Vercel and GitHub Actions.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Environment Setup](#environment-setup)
3. [Vercel Configuration](#vercel-configuration)
4. [GitHub Actions CI/CD](#github-actions-cicd)
5. [Multi-Environment Strategy](#multi-environment-strategy)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ or 20+
- GitHub repository connected
- Vercel account
- Clerk account (authentication)
- Supabase project

### One-Click Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_ORG/portapro)

After clicking:
1. Connect your GitHub account
2. Configure environment variables (see below)
3. Deploy!

---

## Environment Setup

### Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_ORG/portapro.git
   cd portapro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   # Interactive setup wizard
   node scripts/seed-env.js
   
   # Or manually copy from example
   cp .env.example .env
   # Then edit .env with your values
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

### Required Environment Variables

#### Public Variables (VITE_* - exposed to browser)

```bash
VITE_APP_URL=http://localhost:5173
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
VITE_SUPABASE_PROJECT_ID=xxx
VITE_MAPBOX_TOKEN=pk.xxx  # Optional - can use edge function instead
```

#### Server-Only Variables (never exposed to browser)

```bash
CLERK_SECRET_KEY=sk_test_...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
STRIPE_SECRET_KEY=sk_test_...  # Optional
RESEND_API_KEY=re_...  # Optional
```

#### Optional Analytics

```bash
VITE_POSTHOG_KEY=phc_...
VITE_SENTRY_DSN=https://...
VITE_GA_MEASUREMENT_ID=G-...
```

---

## Vercel Configuration

### Project Setup

1. **Import your GitHub repository** to Vercel
2. **Set Framework Preset:** Vite
3. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm ci`

### Environment Variables in Vercel

**Important:** Add environment variables in Vercel Dashboard → Settings → Environment Variables

#### For All Environments (Production + Preview + Development)

Add all `VITE_*` public variables and server secrets.

**Tip:** Use different values for each environment:
- **Development:** Test keys
- **Preview:** Staging keys
- **Production:** Live keys

### Advanced Configuration

Create `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "framework": "vite",
  "installCommand": "npm ci",
  "outputDirectory": "dist",
  "env": {
    "NODE_OPTIONS": "--max_old_space_size=4096"
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max_old_space_size=4096"
    }
  },
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

---

## GitHub Actions CI/CD

### Setup GitHub Secrets

Navigate to **GitHub Repository → Settings → Secrets and variables → Actions**

Add the following secrets:

```
VERCEL_TOKEN           # From Vercel → Account Settings → Tokens
VERCEL_ORG_ID          # From Vercel → Settings → General
VERCEL_PROJECT_ID      # From Vercel → Project Settings → General
SENTRY_AUTH_TOKEN      # Optional - for release tracking
SENTRY_ORG             # Optional
SENTRY_PROJECT         # Optional
```

### CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) automatically:

1. **On Pull Request:**
   - Runs type checking
   - Checks for forbidden patterns (static imports, env access violations)
   - Builds the application
   - Validates bundle size (fails if > 250 KB gzipped)
   - Deploys preview to Vercel

2. **On Push to `main`:**
   - All quality checks above
   - Deploys to Vercel Production
   - Notifies Sentry of new release

### Manual Workflow Trigger

You can manually trigger deployments from GitHub Actions tab.

---

## Multi-Environment Strategy

### Environment Breakdown

| Environment | Branch | Vercel | Purpose |
|------------|--------|--------|---------|
| **Development** | `develop` | Preview | Feature development |
| **Staging** | `staging` | Preview | QA testing |
| **Production** | `main` | Production | Live deployment |

### Workflow

```
Feature Branch → develop → staging → main
     ↓              ↓          ↓        ↓
  Local Dev    Preview    Preview   Production
```

### Best Practices

1. **Always deploy to Preview first** via PR
2. **Test thoroughly** on Preview URL
3. **Merge to main** only after QA approval
4. **Use semantic versioning** for releases
5. **Tag releases** in GitHub for rollback capability

---

## Monitoring & Analytics

### Sentry (Error Tracking)

1. **Create Sentry project:** https://sentry.io
2. **Get DSN** from Project Settings
3. **Add to environment variables:**
   ```bash
   VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_AUTH_TOKEN=xxx  # For GitHub Actions
   SENTRY_ORG=your-org
   SENTRY_PROJECT=portapro
   ```

4. **Initialize in code:**
   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";
   
   if (import.meta.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
       tracesSampleRate: 1.0,
     });
   }
   ```

### PostHog (Analytics) - Optional

1. **Sign up:** https://posthog.com
2. **Get Project API Key**
3. **Add to environment variables:**
   ```bash
   VITE_POSTHOG_KEY=phc_xxx
   ```

4. **Initialize in code:**
   ```typescript
   // src/lib/posthog.ts
   import posthog from 'posthog-js';
   
   if (import.meta.env.VITE_POSTHOG_KEY) {
     posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
       api_host: 'https://app.posthog.com'
     });
   }
   ```

---

## Troubleshooting

### Build Failures

**Bundle size exceeded:**
```bash
# Run locally to debug
npm run build
node scripts/check-bundle-size.js
```

Solution: Check for accidentally static-imported heavy libraries (jspdf, mapbox-gl, recharts)

**Type errors:**
```bash
# Run type check locally
npm run type-check
```

**Forbidden patterns detected:**
```bash
# Check what patterns are failing
node scripts/check-forbidden-patterns.js
```

### Deployment Issues

**Vercel build fails but local works:**
- Check Node version matches (18 or 20)
- Verify all environment variables are set in Vercel
- Check build logs in Vercel dashboard

**Environment variables not working:**
- Ensure `VITE_*` prefix for public vars
- Server vars should NOT have `VITE_` prefix
- Rebuild after adding new env vars

**Preview deployment not updating:**
- Check GitHub Actions workflow ran successfully
- Verify Vercel integration is active
- Check Vercel deployment logs

### Performance Issues

**Slow initial load:**
- Verify dynamic imports are being used (check Network tab)
- Run bundle size analysis
- Enable gzip compression (automatic in Vercel)

**Map not loading:**
- Check Mapbox token is valid
- Verify edge function `get-mapbox-token` is deployed
- Check browser console for errors

---

## Rollback Procedure

### Using Vercel

1. Go to **Vercel → Project → Deployments**
2. Find the last working deployment
3. Click **⋯** → **Promote to Production**

### Using GitHub

1. **Revert the commit:**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Or reset to previous tag:**
   ```bash
   git reset --hard <tag-name>
   git push origin main --force  # Use with caution!
   ```

---

## Checklist for New Deployments

- [ ] All environment variables set in Vercel
- [ ] GitHub Actions workflow passing
- [ ] Bundle size < 250 KB gzipped
- [ ] No forbidden patterns detected
- [ ] Type checking passes
- [ ] Preview deployment tested
- [ ] Sentry error tracking configured
- [ ] DNS/Custom domain configured (if applicable)
- [ ] SSL certificate active
- [ ] All integrations (Clerk, Supabase, Stripe) configured
- [ ] Edge functions deployed (Supabase)

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Sentry React Setup](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

---

## Support

For deployment issues:
1. Check this guide first
2. Review Vercel deployment logs
3. Check GitHub Actions workflow logs
4. Contact development team

**Last Updated:** 2025-01-28
