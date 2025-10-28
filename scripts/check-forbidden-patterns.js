#!/usr/bin/env node

/**
 * Forbidden Pattern Checker for PortaPro
 * 
 * Prevents common anti-patterns that break multi-tenant deployments:
 * - Static imports of heavy libraries (jspdf, mapbox-gl, recharts)
 * - Direct import.meta.env.VITE_* access outside env.client.ts
 * - Hard-coded tenant/organization IDs
 * - Supabase Auth usage (should use Clerk)
 */

const fs = require('fs');
const path = require('path');

const FORBIDDEN_PATTERNS = [
  {
    pattern: /import\s+.*\s+from\s+['"]jspdf['"]/g,
    message: 'Static import of jspdf detected. Use dynamic import via loadPdfLibs() instead.',
    severity: 'error',
    exclude: ['src/lib/loaders/pdf.ts']
  },
  {
    pattern: /import\s+.*\s+from\s+['"]jspdf-autotable['"]/g,
    message: 'Static import of jspdf-autotable detected. Use dynamic import via loadPdfLibs() instead.',
    severity: 'error',
    exclude: ['src/lib/loaders/pdf.ts']
  },
  {
    pattern: /import\s+mapboxgl\s+from\s+['"]mapbox-gl['"]/g,
    message: 'Static import of mapbox-gl detected. Use dynamic import via loadMapboxLibs() instead.',
    severity: 'error',
    exclude: ['src/lib/loaders/map.ts']
  },
  {
    pattern: /import\s+\{[^}]*\}\s+from\s+['"]recharts['"]/g,
    message: 'Static import of recharts detected. Use dynamic import via ChartWrapper instead.',
    severity: 'error',
    exclude: ['src/lib/loaders/charts.ts']
  },
  {
    pattern: /import\.meta\.env\.VITE_/g,
    message: 'Direct import.meta.env.VITE_* access detected. Use env from @/env.client instead.',
    severity: 'error',
    exclude: ['src/env.client.ts', 'vite.config.ts']
  },
  {
    pattern: /auth\.uid\(\)/g,
    message: 'Supabase auth.uid() detected. Use Clerk authentication instead.',
    severity: 'error',
    exclude: ['supabase/migrations/']
  },
  {
    pattern: /const\s+TENANT_ID\s*=\s*['"][^'"]+['"]/g,
    message: 'Hard-coded tenant ID detected. Use runtime resolution via useOrganizationId() instead.',
    severity: 'warning',
    exclude: []
  },
  {
    pattern: /const\s+ORG_ID\s*=\s*['"][^'"]+['"]/g,
    message: 'Hard-coded organization ID detected. Use runtime resolution via useOrganizationId() instead.',
    severity: 'warning',
    exclude: []
  }
];

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function shouldExcludeFile(filePath, excludePatterns) {
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);
    
    // Skip node_modules, dist, and hidden directories
    if (file.isDirectory()) {
      if (!['node_modules', 'dist', '.git', '.github'].includes(file.name)) {
        scanDirectory(filePath, results);
      }
      continue;
    }

    // Only check TypeScript and JavaScript files
    if (!/\.(ts|tsx|js|jsx)$/.test(file.name)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    FORBIDDEN_PATTERNS.forEach(({ pattern, message, severity, exclude }) => {
      if (shouldExcludeFile(filePath, exclude)) return;

      let match;
      const regex = new RegExp(pattern.source, pattern.flags);
      
      while ((match = regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        results.push({
          file: filePath.replace(process.cwd() + '/', ''),
          line: lineNumber,
          message,
          severity,
          code: lines[lineNumber - 1].trim()
        });
      }
    });
  }

  return results;
}

function run() {
  console.log(`\n${colors.bold}🔍 Scanning for forbidden patterns...${colors.reset}\n`);

  const results = scanDirectory(path.join(process.cwd(), 'src'));
  
  if (results.length === 0) {
    console.log(`${colors.green}✅ No forbidden patterns detected${colors.reset}\n`);
    process.exit(0);
  }

  const errors = results.filter(r => r.severity === 'error');
  const warnings = results.filter(r => r.severity === 'warning');

  if (errors.length > 0) {
    console.log(`${colors.red}${colors.bold}❌ ${errors.length} Error(s) Found${colors.reset}\n`);
    errors.forEach(({ file, line, message, code }) => {
      console.log(`${colors.red}ERROR${colors.reset} ${file}:${line}`);
      console.log(`  ${colors.dim}${code}${colors.reset}`);
      console.log(`  ${message}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`${colors.yellow}${colors.bold}⚠️  ${warnings.length} Warning(s) Found${colors.reset}\n`);
    warnings.forEach(({ file, line, message, code }) => {
      console.log(`${colors.yellow}WARNING${colors.reset} ${file}:${line}`);
      console.log(`  ${colors.dim}${code}${colors.reset}`);
      console.log(`  ${message}\n`);
    });
  }

  if (errors.length > 0) {
    console.log(`${colors.red}${colors.bold}Build failed due to ${errors.length} error(s)${colors.reset}`);
    console.log(`${colors.dim}Fix the errors above and try again.${colors.reset}\n`);
    process.exit(1);
  }

  console.log(`${colors.green}✅ All critical checks passed${colors.reset}`);
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Please address ${warnings.length} warning(s) when possible${colors.reset}\n`);
  }
  process.exit(0);
}

run();
