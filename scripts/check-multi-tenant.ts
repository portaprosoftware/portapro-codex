#!/usr/bin/env node

/**
 * Multi-Tenant Code Scanner
 * 
 * Scans the codebase for potential multi-tenant violations:
 * - Direct .insert() without safeInsert()
 * - Direct .update() without safeUpdate() or organization_id filter
 * - Direct .delete() without safeDelete() or organization_id filter
 * - Missing useOrganizationId() in components with DB operations
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

interface Violation {
  file: string;
  line: number;
  severity: 'error' | 'warning';
  issue: string;
  suggestion: string;
}

const violations: Violation[] = [];

// Tables that are system-wide (not org-scoped)
const SYSTEM_TABLES = ['tax_rates'];

// Tables that use user_id instead of organization_id
const USER_SCOPED_TABLES = ['notification_preferences', 'push_subscriptions', 'user_roles'];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', '.git', 'test', 'scripts'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (['.ts', '.tsx'].includes(extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function checkFile(filePath: string) {
  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = relative(process.cwd(), filePath);
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    const trimmed = line.trim();
    
    // Skip comments, imports, and marked exceptions
    if (
      trimmed.startsWith('//') ||
      trimmed.startsWith('*') ||
      trimmed.includes('import ') ||
      trimmed.includes('// OK: system-wide') ||
      trimmed.includes('// Multi-tenant safe') ||
      trimmed.includes('// No orgId needed')
    ) {
      return;
    }

    // Check for direct .insert()
    if (trimmed.includes('.insert(')) {
      const isSystemTable = SYSTEM_TABLES.some(table => 
        line.includes(`'${table}'`) || line.includes(`"${table}"`)
      );
      const usesSafeInsert = content.includes('safeInsert');
      
      if (!isSystemTable && !usesSafeInsert) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          severity: 'error',
          issue: 'Direct .insert() without safeInsert()',
          suggestion: 'Replace with: safeInsert(table, data, orgId)',
        });
      }
    }

    // Check for direct .update()
    if (trimmed.includes('.update(')) {
      const hasOrgFilter = 
        line.includes('.eq(\'organization_id\'') ||
        line.includes('.eq("organization_id"') ||
        USER_SCOPED_TABLES.some(table => line.includes(table));
      const usesSafeUpdate = content.includes('safeUpdate');
      
      if (!hasOrgFilter && !usesSafeUpdate) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          severity: 'error',
          issue: 'Direct .update() without organization_id filter or safeUpdate()',
          suggestion: 'Add .eq(\'organization_id\', orgId) or use safeUpdate()',
        });
      }
    }

    // Check for direct .delete()
    if (trimmed.includes('.delete()')) {
      const hasOrgFilter = 
        content.includes('.eq(\'organization_id\'') ||
        content.includes('.eq("organization_id"');
      const usesSafeDelete = content.includes('safeDelete');
      
      if (!hasOrgFilter && !usesSafeDelete) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          severity: 'error',
          issue: 'Direct .delete() without organization_id filter or safeDelete()',
          suggestion: 'Add .eq(\'organization_id\', orgId) or use safeDelete()',
        });
      }
    }

    // Check for .select() without organization_id filter
    if (trimmed.includes('.select(') && trimmed.includes('supabase.from(')) {
      const nextLines = lines.slice(index, Math.min(index + 5, lines.length)).join('\n');
      const hasOrgFilter = 
        nextLines.includes('.eq(\'organization_id\'') ||
        nextLines.includes('.eq("organization_id"') ||
        SYSTEM_TABLES.some(table => line.includes(table));
      
      if (!hasOrgFilter) {
        violations.push({
          file: relativePath,
          line: lineNumber,
          severity: 'warning',
          issue: 'SELECT query may be missing organization_id filter',
          suggestion: 'Add .eq(\'organization_id\', orgId) to query',
        });
      }
    }
  });

  // Check if file has DB operations but doesn't use useOrganizationId
  const hasDbOps = 
    content.includes('supabase.from(') ||
    content.includes('safeInsert') ||
    content.includes('safeUpdate') ||
    content.includes('safeDelete');
  
  const usesOrgHook = content.includes('useOrganizationId');
  const isTestFile = filePath.includes('.test.');
  const isHelperFile = filePath.includes('supabase-helpers');
  
  if (hasDbOps && !usesOrgHook && !isTestFile && !isHelperFile) {
    violations.push({
      file: relativePath,
      line: 1,
      severity: 'warning',
      issue: 'File has DB operations but doesn\'t use useOrganizationId()',
      suggestion: 'Import and use: const { orgId } = useOrganizationId();',
    });
  }
}

function generateReport() {
  const errors = violations.filter(v => v.severity === 'error');
  const warnings = violations.filter(v => v.severity === 'warning');

  console.log('\n🔍 Multi-Tenant Code Scanner Results\n');
  console.log('='.repeat(80));

  if (errors.length === 0 && warnings.length === 0) {
    console.log('\n✅ No violations found! Code is multi-tenant safe.\n');
    return 0;
  }

  if (errors.length > 0) {
    console.log(`\n❌ ${errors.length} ERROR(S) Found:\n`);
    errors.forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}:${v.line}`);
      console.log(`   Issue: ${v.issue}`);
      console.log(`   Fix: ${v.suggestion}\n`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  ${warnings.length} WARNING(S) Found:\n`);
    warnings.forEach((v, i) => {
      console.log(`${i + 1}. ${v.file}:${v.line}`);
      console.log(`   Issue: ${v.issue}`);
      console.log(`   Suggestion: ${v.suggestion}\n`);
    });
  }

  console.log('='.repeat(80));
  console.log(`\nTotal: ${errors.length} errors, ${warnings.length} warnings`);
  console.log('\n💡 Run: npm run test:multi-tenant to verify fixes\n');

  return errors.length > 0 ? 1 : 0;
}

// Main execution
const srcDir = join(process.cwd(), 'src');
const files = scanDirectory(srcDir);

files.forEach(checkFile);

const exitCode = generateReport();
process.exit(exitCode);
