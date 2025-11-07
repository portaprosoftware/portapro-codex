# Multi-Tenant Testing Guide

This document explains how to use the automated testing tools to ensure multi-tenant data isolation in PortaPro.

## 🎯 Overview

PortaPro uses a comprehensive testing strategy to prevent multi-tenant data leaks:

1. **Unit Tests** - Verify safe helper functions work correctly
2. **Integration Tests** - Test complete database operation flows
3. **Static Code Analysis** - Scan codebase for violations
4. **ESLint Rules** - Prevent violations at development time

## 🧪 Running Tests

### All Tests
```bash
npm run test
```

### Multi-Tenant Specific Tests
```bash
npm run test:multi-tenant
```

### Code Scanner
```bash
npm run scan:multi-tenant
```

### Watch Mode (During Development)
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## 📋 Test Categories

### 1. Helper Function Tests (`src/lib/supabase-helpers.test.ts`)

Tests the core `safeInsert()`, `safeUpdate()`, and `safeDelete()` functions:

- ✅ Throws error when `orgId` is `null` or `undefined`
- ✅ Adds `organization_id` to single records
- ✅ Adds `organization_id` to arrays of records
- ✅ Filters by `organization_id` in updates/deletes
- ✅ Applies additional match conditions correctly

**Example:**
```typescript
// ❌ BAD - Will fail tests
await supabase.from('jobs').insert({ title: 'Test Job' });

// ✅ GOOD - Passes tests
await safeInsert('jobs', { title: 'Test Job' }, orgId);
```

### 2. Code Scanner Tests (`src/test/code-scanner.test.ts`)

Scans the entire codebase for violations:

- Detects direct `.insert()` without `safeInsert()`
- Detects direct `.update()` without `safeUpdate()` or org filter
- Detects direct `.delete()` without `safeDelete()` or org filter
- Verifies components use `useOrganizationId()` hook

**Example Output:**
```
⚠️  Multi-Tenant Violations Found:
  src/components/example.tsx:42 - Direct .insert() usage detected
  src/hooks/useExample.ts:18 - Direct .update() usage detected
```

### 3. Integration Tests (`src/test/integration/multi-tenant.test.ts`)

Tests complete multi-tenant workflows:

- Data isolation between organizations
- Batch operations with `organization_id`
- Edge cases (empty strings, whitespace)
- Query patterns and filtering

## 🛠️ Development Workflow

### Before Committing Code

1. **Run Tests:**
   ```bash
   npm run test:multi-tenant
   ```

2. **Run Scanner:**
   ```bash
   npm run scan:multi-tenant
   ```

3. **Fix Any Violations** - Follow the suggestions provided

### When Adding New Features

1. **Use Safe Helpers:**
   ```typescript
   import { safeInsert, safeUpdate, safeDelete } from '@/lib/supabase-helpers';
   import { useOrganizationId } from '@/hooks/useOrganizationId';

   function MyComponent() {
     const { orgId } = useOrganizationId();

     const createItem = async (data) => {
       await safeInsert('items', data, orgId);
     };
   }
   ```

2. **Add Tests** for new database operations

3. **Verify ESLint** shows no warnings

## 🚨 Common Violations and Fixes

### Violation 1: Direct Insert

❌ **Before:**
```typescript
await supabase.from('products').insert({ name: 'Product' });
```

✅ **After:**
```typescript
const { orgId } = useOrganizationId();
await safeInsert('products', { name: 'Product' }, orgId);
```

### Violation 2: Direct Update Without Filter

❌ **Before:**
```typescript
await supabase.from('jobs').update({ status: 'completed' }).eq('id', jobId);
```

✅ **After (Option 1 - safeUpdate):**
```typescript
const { orgId } = useOrganizationId();
await safeUpdate('jobs', { status: 'completed' }, orgId, { id: jobId });
```

✅ **After (Option 2 - Manual Filter):**
```typescript
const { orgId } = useOrganizationId();
await supabase
  .from('jobs')
  .update({ status: 'completed' })
  .eq('organization_id', orgId)
  .eq('id', jobId);
```

### Violation 3: Direct Delete Without Filter

❌ **Before:**
```typescript
await supabase.from('customers').delete().eq('id', customerId);
```

✅ **After:**
```typescript
const { orgId } = useOrganizationId();
await safeDelete('customers', orgId, { id: customerId });
```

### Violation 4: Missing Organization Filter in SELECT

❌ **Before:**
```typescript
const { data } = await supabase.from('jobs').select('*');
```

✅ **After:**
```typescript
const { orgId } = useOrganizationId();
const { data } = await supabase
  .from('jobs')
  .select('*')
  .eq('organization_id', orgId);
```

## 🔍 Exceptions

Some tables are **system-wide** and don't need `organization_id`:

- `tax_rates` - Shared sales tax lookup data
- Tables with `// OK: system-wide` comment

Some tables use **user_id** instead of `organization_id`:

- `notification_preferences`
- `push_subscriptions`
- `user_roles`

Mark these with comments:
```typescript
// OK: system-wide data
await supabase.from('tax_rates').upsert(data, { onConflict: 'zip_code' });
```

## 📊 CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Multi-Tenant Tests
  run: npm run test:multi-tenant

- name: Scan for Violations
  run: npm run scan:multi-tenant
```

## 🎓 Best Practices

1. **Always use `useOrganizationId()`** in components with DB operations
2. **Prefer `safeInsert/Update/Delete`** over manual filters
3. **Add comments** for legitimate exceptions
4. **Run tests** before committing
5. **Review violations** in PR reviews
6. **Keep tests updated** when adding new tables/features

## 📚 Additional Resources

- [Multi-Tenant Architecture Guide](./docs/multi-tenant.md)
- [Supabase Helper Functions](./src/lib/supabase-helpers.ts)
- [ESLint Rules](./eslint.config.js)

## 🆘 Troubleshooting

### Test Failures

**"Organization ID required" error:**
- Ensure `useOrganizationId()` is called in your component
- Check that `orgId` is passed to safe helpers

**Code scanner warnings:**
- Review the suggestions provided
- Add appropriate comments if it's a legitimate exception
- Refactor to use safe helpers

### False Positives

If the scanner flags a legitimate exception:

```typescript
// OK: system-wide tax lookup data
await supabase.from('tax_rates').upsert(data);
```

Or disable for specific cases:
```typescript
// Multi-tenant safe: user_id filter applied
await supabase.from('user_roles').update(data).eq('user_id', userId);
```

---

**Questions?** Check the main README or contact the development team.
