# Multi-Tenant Safety Guide

## 🔒 Overview

PortaPro enforces **bulletproof multi-tenant data isolation** at the database layer to prevent:
- Cross-organization data leakage
- Accidental data exposure
- Data modification across tenant boundaries
- Single-record query assumptions that break with tenant scoping

## ✅ Required Patterns

### 1. Safe Database Operations

All Supabase operations MUST use the safe helpers from `src/lib/supabase-helpers.ts`:

#### ✅ Safe Insert
```typescript
import { safeInsert } from '@/lib/supabase-helpers';
import { useOrganizationId } from '@/hooks/useOrganizationId';

const { orgId } = useOrganizationId();

// ✅ CORRECT
const { error } = await safeInsert('vehicles', vehicleData, orgId);

// ❌ WRONG - Will be blocked by ESLint
const { error } = await supabase.from('vehicles').insert(vehicleData);
```

#### ✅ Safe Update
```typescript
import { safeUpdate } from '@/lib/supabase-helpers';

// ✅ CORRECT
const { error } = await safeUpdate('vehicles', updateData, orgId, { id: vehicleId });

// ❌ WRONG - Will be blocked by ESLint
const { error } = await supabase.from('vehicles').update(updateData).eq('id', vehicleId);
```

#### ✅ Safe Delete
```typescript
import { safeDelete } from '@/lib/supabase-helpers';

// ✅ CORRECT
const { error } = await safeDelete('vehicles', orgId, { id: vehicleId });

// ❌ WRONG - Will be blocked by ESLint
const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
```

#### ✅ Safe Read
```typescript
import { safeRead } from '@/lib/supabase-helpers';

// ✅ CORRECT - Automatically filters by organization_id
const { data, error } = await safeRead('vehicles', orgId, { status: 'active' });

// ⚠️  ALLOWED but requires manual org filter
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('organization_id', orgId)  // Must include this!
  .eq('status', 'active');
```

### 2. Query Result Handling

#### ✅ Use .maybeSingle() Instead of .single()

```typescript
// ✅ CORRECT - Handles missing records gracefully
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .maybeSingle();

if (!data) {
  // Handle missing record
  toast.error('Vehicle not found');
  return;
}

// ❌ WRONG - Throws exception, breaks multi-tenant queries
const { data, error } = await supabase
  .from('vehicles')
  .select('*')
  .eq('id', vehicleId)
  .single();  // Will be blocked by ESLint
```

**Why `.maybeSingle()` is required:**
- `.single()` throws an error if 0 or 2+ rows are returned
- Multi-tenant queries naturally return 0 rows for wrong organization
- `.maybeSingle()` returns `null` for 0 rows, making it safe for tenant scoping

## 🚫 Prohibited Patterns

ESLint will **automatically block** these patterns:

```typescript
// ❌ Direct insert without organization_id
supabase.from('table').insert(data)

// ❌ Direct update without organization_id filter
supabase.from('table').update(data).eq('id', id)

// ❌ Direct delete without organization_id filter
supabase.from('table').delete().eq('id', id)

// ❌ Using .single() instead of .maybeSingle()
supabase.from('table').select('*').eq('id', id).single()
```

## 🔍 Testing & Verification

### Run Multi-Tenant Scanner

```bash
npm run scan:unsafe-queries
```

This scans for:
- ✅ Direct `.insert()` calls (should be 0)
- ✅ Direct `.update()` calls (should be 0)
- ✅ Direct `.delete()` calls (should be 0)
- ✅ `.single()` calls (should be 0)

### Run Unit Tests

```bash
npm run test:multi-tenant
```

This runs:
- `src/lib/supabase-helpers.test.ts` - Unit tests for safe helpers
- `src/test/integration/multi-tenant.test.ts` - Integration tests
- `src/test/code-scanner.test.ts` - Static analysis tests

### Auto-Fix .single() Calls

```bash
npm run fix:single-calls
```

Automatically replaces all `.single()` with `.maybeSingle()` across the codebase.

## 🛡️ ESLint Enforcement

The following ESLint rules enforce multi-tenant safety:

**File:** `eslint.config.js`

```javascript
"no-restricted-syntax": [
  "error",
  {
    "selector": "CallExpression[callee.property.name='insert']...",
    "message": "Use safeInsert() from @/lib/supabase-helpers"
  },
  {
    "selector": "CallExpression[callee.property.name='update']...",
    "message": "Use safeUpdate() from @/lib/supabase-helpers"
  },
  {
    "selector": "CallExpression[callee.property.name='delete']...",
    "message": "Use safeDelete() from @/lib/supabase-helpers"
  },
  {
    "selector": "CallExpression[callee.property.name='single']",
    "message": "Replace .single() with .maybeSingle()"
  }
]
```

These rules are enforced:
- ✅ In your IDE (real-time feedback)
- ✅ On `git commit` (pre-commit hook)
- ✅ In CI/CD (GitHub Actions)
- ✅ On Vercel builds (`prebuild` script)

## 📝 Migration Checklist

When adding new features:

- [ ] Import `useOrganizationId` hook
- [ ] Get `orgId` from the hook
- [ ] Use `safeInsert/Update/Delete/Read` for all operations
- [ ] Replace any `.single()` with `.maybeSingle()`
- [ ] Handle `!data` cases gracefully
- [ ] Test with multiple organizations
- [ ] Run `npm run scan:unsafe-queries`

## 🎯 Success Criteria

Step 2 is complete when:

- ✅ `safeRead()` helper exists in `supabase-helpers.ts`
- ✅ All `.single()` calls replaced with `.maybeSingle()`
- ✅ All database operations use safe helpers
- ✅ ESLint blocks unsafe patterns
- ✅ Scanner reports 0 violations
- ✅ All multi-tenant tests passing

## 🔗 Related Documentation

- [Testing Guide](./TESTING.md)
- [Database Schema](../supabase/README.md)
- [Clerk Multi-Tenant Setup](./CLERK_SETUP.md)
