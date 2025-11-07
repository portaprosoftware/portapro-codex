# Test Setup Instructions

## Add Test Scripts to package.json

Add the following scripts to your `package.json` file in the `"scripts"` section:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:multi-tenant": "vitest run src/lib/supabase-helpers.test.ts src/test/code-scanner.test.ts src/test/integration/multi-tenant.test.ts",
    "scan:multi-tenant": "tsx scripts/check-multi-tenant.ts"
  }
}
```

## Install Additional Dependencies

If not already installed:

```bash
npm install -D tsx @vitest/coverage-v8
```

## Run Tests

### All Tests
```bash
npm run test
```

### Watch Mode (Development)
```bash
npm run test:watch
```

### Interactive UI
```bash
npm run test:ui
```

### Coverage Report
```bash
npm run test:coverage
```

### Multi-Tenant Specific
```bash
npm run test:multi-tenant
```

### Code Scanner
```bash
npm run scan:multi-tenant
```

## CI/CD Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Multi-Tenant Tests
        run: npm run test:multi-tenant
      
      - name: Scan for Multi-Tenant Violations
        run: npm run scan:multi-tenant
      
      - name: Run All Tests
        run: npm run test
      
      - name: Generate Coverage
        run: npm run test:coverage
```

## Pre-commit Hook

Add to `.husky/pre-commit` (if using Husky):

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run scan:multi-tenant
npm run test:multi-tenant
```

Or use `lint-staged` in `package.json`:

```json
{
  "lint-staged": {
    "src/**/*.{ts,tsx}": [
      "npm run scan:multi-tenant",
      "npm run test:multi-tenant"
    ]
  }
}
```

## Verification

After setup, verify everything works:

```bash
# Should pass all tests
npm run test:multi-tenant

# Should report no violations (or only documented exceptions)
npm run scan:multi-tenant
```

## Next Steps

1. Review `README-TESTING.md` for detailed testing guide
2. Fix any violations found by the scanner
3. Add tests for new features
4. Integrate into CI/CD pipeline
