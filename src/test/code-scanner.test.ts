import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const VIOLATIONS: Array<{ file: string; line: number; issue: string }> = [];

/**
 * Recursively scan directory for TypeScript/TSX files
 */
function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, dist, and test directories
      if (!['node_modules', 'dist', '.git', 'test'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (['.ts', '.tsx'].includes(extname(file))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

/**
 * Check if a line contains a direct Supabase operation
 */
function checkForDirectOperations(content: string, filePath: string) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Skip comments and imports
    if (line.trim().startsWith('//') || line.trim().startsWith('*') || line.includes('import')) {
      return;
    }

    // Check for direct insert without safeInsert
    if (
      line.includes('.insert(') && 
      !line.includes('safeInsert') &&
      !line.includes('// Multi-tenant safe') &&
      !line.includes('// OK: system-wide')
    ) {
      // Allow exceptions for specific tables
      const allowedTables = ['tax_rates', 'business_hours'];
      const hasException = allowedTables.some(table => line.includes(`'${table}'`) || line.includes(`"${table}"`));
      
      if (!hasException) {
        VIOLATIONS.push({
          file: filePath,
          line: lineNumber,
          issue: 'Direct .insert() usage detected - should use safeInsert()',
        });
      }
    }

    // Check for direct update without safeUpdate
    if (
      line.includes('.update(') && 
      !line.includes('safeUpdate') &&
      !line.includes('// Multi-tenant safe') &&
      !line.includes('// OK: system-wide')
    ) {
      const allowedPatterns = [
        '.eq(\'organization_id\',',
        '.eq("organization_id",',
        'user_id',
        'driver_id',
        'business_hours',
      ];
      
      const hasException = allowedPatterns.some(pattern => line.includes(pattern));
      
      if (!hasException) {
        VIOLATIONS.push({
          file: filePath,
          line: lineNumber,
          issue: 'Direct .update() usage detected - should use safeUpdate() or include organization_id filter',
        });
      }
    }

    // Check for direct delete without safeDelete
    if (
      line.includes('.delete()') && 
      !line.includes('safeDelete') &&
      !line.includes('// Multi-tenant safe') &&
      !line.includes('// OK: system-wide')
    ) {
      const hasOrgFilter = content.includes('.eq(\'organization_id\'') || content.includes('.eq("organization_id"');
      
      if (!hasOrgFilter) {
        VIOLATIONS.push({
          file: filePath,
          line: lineNumber,
          issue: 'Direct .delete() usage detected - should use safeDelete() or include organization_id filter',
        });
      }
    }
  });
}

/**
 * Main test to scan codebase for violations
 */
describe('Multi-Tenant Code Scanning', () => {
  it('should not have direct Supabase operations without organization_id filtering', () => {
    const srcDir = join(process.cwd(), 'src');
    const files = scanDirectory(srcDir);
    
    // Filter to only component and hook files (skip test files and config)
    const relevantFiles = files.filter(
      f => !f.includes('.test.') && 
           !f.includes('.config.') && 
           !f.includes('supabase-helpers.ts') &&
           !f.includes('/test/') &&
           !f.includes('types.ts')
    );
    
    relevantFiles.forEach((filePath) => {
      const content = readFileSync(filePath, 'utf-8');
      checkForDirectOperations(content, filePath);
    });

    if (VIOLATIONS.length > 0) {
      const report = VIOLATIONS.map(
        v => `  ${v.file}:${v.line} - ${v.issue}`
      ).join('\n');
      
      console.error('\n⚠️  Multi-Tenant Violations Found:\n' + report + '\n');
    }

    expect(VIOLATIONS).toHaveLength(0);
  });

  it('should use useOrganizationId hook in components performing database operations', () => {
    const srcDir = join(process.cwd(), 'src/components');
    const files = scanDirectory(srcDir);
    
    const componentsWithDbOps: string[] = [];
    
    files.forEach((filePath) => {
      const content = readFileSync(filePath, 'utf-8');
      
      // Check if file has database operations
      const hasDbOps = content.includes('supabase.from(') || 
                       content.includes('safeInsert') ||
                       content.includes('safeUpdate') ||
                       content.includes('safeDelete');
      
      // Check if file uses useOrganizationId
      const usesOrgHook = content.includes('useOrganizationId');
      
      if (hasDbOps && !usesOrgHook && !content.includes('// No orgId needed')) {
        componentsWithDbOps.push(filePath);
      }
    });

    if (componentsWithDbOps.length > 0) {
      console.warn(
        '\n⚠️  Components with DB operations missing useOrganizationId:\n' +
        componentsWithDbOps.map(f => `  - ${f}`).join('\n') + '\n'
      );
    }

    // This is a warning, not a hard failure (some components may get orgId from props)
    expect(componentsWithDbOps.length).toBeLessThan(10);
  });
});

describe('ESLint Integration', () => {
  it('should have ESLint rules for restricted Supabase operations', () => {
    const eslintConfig = readFileSync(join(process.cwd(), 'eslint.config.js'), 'utf-8');
    
    expect(eslintConfig).toContain('no-restricted-syntax');
    expect(eslintConfig).toContain('supabase');
    expect(eslintConfig).toContain('.insert(');
    expect(eslintConfig).toContain('.update(');
    expect(eslintConfig).toContain('.delete(');
  });
});
