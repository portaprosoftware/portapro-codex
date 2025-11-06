/**
 * Multi-Tenant Security Audit Script
 * 
 * Scans all hooks and components for:
 * 1. Supabase queries missing organization_id filters
 * 2. RPC calls missing org_id parameters
 * 3. Query keys missing orgId for proper cache isolation
 * 
 * Run: npx tsx scripts/verify-multi-tenant.ts
 */

import * as fs from 'fs';
import * as path from 'path';

interface SecurityFinding {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  file: string;
  line: number;
  issue: string;
  code: string;
  recommendation: string;
}

const findings: SecurityFinding[] = [];
const scannedFiles: string[] = [];
let totalQueries = 0;
let totalRpcCalls = 0;
let secureQueries = 0;
let secureRpcCalls = 0;

/**
 * Recursively scan directory for TypeScript files
 */
function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, build directories
      if (!['node_modules', 'dist', 'build', '.git'].includes(file)) {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Check if file imports useOrganizationId
 */
function importsOrganizationId(content: string): boolean {
  return /import.*useOrganizationId.*from/.test(content) ||
         /const.*{.*orgId.*}.*=.*useOrganizationId/.test(content);
}

/**
 * Check if file uses orgId from useOrganizationId
 */
function usesOrgId(content: string): boolean {
  return /const.*{.*orgId.*}.*=.*useOrganizationId/.test(content);
}

/**
 * Find all .from() queries in the content
 */
function findFromQueries(content: string, filePath: string): void {
  const lines = content.split('\n');
  
  // Pattern to match .from('table_name')
  const fromPattern = /\.from\(['"`]([^'"`]+)['"`]\)/g;
  
  lines.forEach((line, index) => {
    const matches = line.matchAll(fromPattern);
    
    for (const match of matches) {
      totalQueries++;
      const tableName = match[1];
      const lineNumber = index + 1;
      
      // Skip certain system tables that don't need org filtering
      const skipTables = [
        'information_schema',
        'pg_',
        'storage.objects',
        'storage.buckets'
      ];
      
      if (skipTables.some(skip => tableName.startsWith(skip))) {
        continue;
      }
      
      // Look ahead in the next 10 lines for .eq('organization_id', ...)
      const nextLines = lines.slice(index, Math.min(index + 15, lines.length)).join('\n');
      const hasOrgFilter = /\.eq\(['"`]organization_id['"`]/.test(nextLines);
      
      if (!hasOrgFilter) {
        findings.push({
          severity: 'CRITICAL',
          file: filePath,
          line: lineNumber,
          issue: `Query on table '${tableName}' missing organization_id filter`,
          code: line.trim(),
          recommendation: `Add .eq('organization_id', orgId) to this query chain`
        });
      } else {
        secureQueries++;
      }
    }
  });
}

/**
 * Find all .rpc() calls in the content
 */
function findRpcCalls(content: string, filePath: string): void {
  const lines = content.split('\n');
  
  // Pattern to match .rpc('function_name', { params })
  const rpcPattern = /\.rpc\(['"`]([^'"`]+)['"`]/g;
  
  lines.forEach((line, index) => {
    const matches = line.matchAll(rpcPattern);
    
    for (const match of matches) {
      totalRpcCalls++;
      const functionName = match[1];
      const lineNumber = index + 1;
      
      // Look ahead in the next 5 lines for the parameters object
      const nextLines = lines.slice(index, Math.min(index + 5, lines.length)).join('\n');
      const hasOrgIdParam = /org_id\s*:/.test(nextLines) || /p_org_id\s*:/.test(nextLines);
      
      if (!hasOrgIdParam) {
        findings.push({
          severity: 'HIGH',
          file: filePath,
          line: lineNumber,
          issue: `RPC call '${functionName}' missing org_id parameter`,
          code: line.trim(),
          recommendation: `Add org_id: orgId to the RPC parameters object`
        });
      } else {
        secureRpcCalls++;
      }
    }
  });
}

/**
 * Check if useQuery includes orgId in queryKey
 */
function checkQueryKeys(content: string, filePath: string): void {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    if (line.includes('queryKey:')) {
      const lineNumber = index + 1;
      // Look at the next 2 lines to see the full queryKey array
      const nextLines = lines.slice(index, Math.min(index + 3, lines.length)).join(' ');
      
      // If file uses orgId but queryKey doesn't include it
      if (usesOrgId(content) && !nextLines.includes('orgId')) {
        findings.push({
          severity: 'MEDIUM',
          file: filePath,
          line: lineNumber,
          issue: 'queryKey missing orgId for proper cache isolation',
          code: line.trim(),
          recommendation: 'Add orgId to the queryKey array'
        });
      }
    }
  });
}

/**
 * Check if hook has proper organization context
 */
function checkHookOrganizationContext(content: string, filePath: string): void {
  // Only check files in hooks directory
  if (!filePath.includes('/hooks/')) {
    return;
  }
  
  // Check if it's a query hook (has useQuery)
  if (!content.includes('useQuery')) {
    return;
  }
  
  // Check if it queries Supabase
  if (!content.includes('supabase.from') && !content.includes('supabase.rpc')) {
    return;
  }
  
  // If it queries Supabase but doesn't import useOrganizationId
  if (!importsOrganizationId(content)) {
    findings.push({
      severity: 'HIGH',
      file: filePath,
      line: 1,
      issue: 'Hook queries Supabase but does not import useOrganizationId',
      code: 'Missing import',
      recommendation: 'Import and use useOrganizationId to enforce multi-tenant isolation'
    });
  }
  
  // If it imports but doesn't use orgId
  if (importsOrganizationId(content) && !usesOrgId(content)) {
    findings.push({
      severity: 'HIGH',
      file: filePath,
      line: 1,
      issue: 'Hook imports useOrganizationId but does not destructure orgId',
      code: 'Import not utilized',
      recommendation: 'Use const { orgId } = useOrganizationId() to get organization context'
    });
  }
}

/**
 * Scan a single file for security issues
 */
function scanFile(filePath: string): void {
  const content = fs.readFileSync(filePath, 'utf-8');
  scannedFiles.push(filePath);
  
  // Run all security checks
  findFromQueries(content, filePath);
  findRpcCalls(content, filePath);
  checkQueryKeys(content, filePath);
  checkHookOrganizationContext(content, filePath);
}

/**
 * Generate and print security audit report
 */
function generateReport(): void {
  console.log('\n' + '='.repeat(100));
  console.log('🔒 MULTI-TENANT SECURITY AUDIT REPORT');
  console.log('='.repeat(100) + '\n');
  
  // Summary statistics
  console.log('📊 SCAN STATISTICS:');
  console.log(`   Files Scanned: ${scannedFiles.length}`);
  console.log(`   Supabase Queries Found: ${totalQueries}`);
  console.log(`   RPC Calls Found: ${totalRpcCalls}`);
  console.log(`   Secure Queries: ${secureQueries}/${totalQueries} (${totalQueries > 0 ? Math.round(secureQueries/totalQueries*100) : 0}%)`);
  console.log(`   Secure RPC Calls: ${secureRpcCalls}/${totalRpcCalls} (${totalRpcCalls > 0 ? Math.round(secureRpcCalls/totalRpcCalls*100) : 0}%)`);
  console.log('');
  
  // Group findings by severity
  const critical = findings.filter(f => f.severity === 'CRITICAL');
  const high = findings.filter(f => f.severity === 'HIGH');
  const medium = findings.filter(f => f.severity === 'MEDIUM');
  const low = findings.filter(f => f.severity === 'LOW');
  
  console.log('🚨 FINDINGS BY SEVERITY:');
  console.log(`   CRITICAL: ${critical.length}`);
  console.log(`   HIGH: ${high.length}`);
  console.log(`   MEDIUM: ${medium.length}`);
  console.log(`   LOW: ${low.length}`);
  console.log('');
  
  // Print detailed findings
  if (findings.length === 0) {
    console.log('✅ NO SECURITY ISSUES FOUND!\n');
    console.log('🎉 All queries and RPC calls are properly secured with organization_id filters.\n');
    return;
  }
  
  console.log('=' + '='.repeat(99));
  console.log('DETAILED FINDINGS');
  console.log('=' + '='.repeat(99) + '\n');
  
  const printFindings = (findingsList: SecurityFinding[], severity: string) => {
    if (findingsList.length === 0) return;
    
    console.log(`\n${'━'.repeat(100)}`);
    console.log(`${severity} SEVERITY ISSUES (${findingsList.length})`);
    console.log('━'.repeat(100) + '\n');
    
    findingsList.forEach((finding, idx) => {
      const emoji = finding.severity === 'CRITICAL' ? '🔴' : 
                    finding.severity === 'HIGH' ? '🟠' : 
                    finding.severity === 'MEDIUM' ? '🟡' : '🔵';
      
      console.log(`${emoji} Issue #${idx + 1}: ${finding.issue}`);
      console.log(`   File: ${finding.file}:${finding.line}`);
      console.log(`   Code: ${finding.code}`);
      console.log(`   Fix:  ${finding.recommendation}`);
      console.log('');
    });
  };
  
  printFindings(critical, 'CRITICAL');
  printFindings(high, 'HIGH');
  printFindings(medium, 'MEDIUM');
  printFindings(low, 'LOW');
  
  // Security score calculation
  const totalIssues = findings.length;
  const criticalWeight = critical.length * 10;
  const highWeight = high.length * 5;
  const mediumWeight = medium.length * 2;
  const lowWeight = low.length * 1;
  const totalWeight = criticalWeight + highWeight + mediumWeight + lowWeight;
  
  const securityScore = Math.max(0, 100 - totalWeight);
  
  console.log('\n' + '='.repeat(100));
  console.log('🎯 SECURITY SCORE');
  console.log('='.repeat(100));
  console.log(`   Score: ${securityScore}/100`);
  console.log(`   Grade: ${securityScore >= 95 ? 'A+' : securityScore >= 90 ? 'A' : securityScore >= 80 ? 'B' : securityScore >= 70 ? 'C' : securityScore >= 60 ? 'D' : 'F'}`);
  
  if (securityScore < 90) {
    console.log(`\n   ⚠️  WARNING: Security score below 90. Address issues before production deployment.`);
  } else if (securityScore >= 95) {
    console.log(`\n   ✅ EXCELLENT: Multi-tenant security implementation is solid.`);
  }
  
  console.log('\n' + '='.repeat(100) + '\n');
  
  // Exit with error code if critical issues found
  if (critical.length > 0 || high.length > 0) {
    console.log('❌ FAILED: Critical or High severity issues found. Fix before deployment.\n');
    process.exit(1);
  } else if (medium.length > 0) {
    console.log('⚠️  WARNING: Medium severity issues found. Review recommended.\n');
    process.exit(0);
  } else {
    console.log('✅ PASSED: No critical security issues detected.\n');
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log('🔍 Starting multi-tenant security audit...\n');
  
  const projectRoot = path.join(__dirname, '..');
  const srcPath = path.join(projectRoot, 'src');
  
  // Scan all TypeScript files
  const files = scanDirectory(srcPath);
  
  console.log(`📂 Scanning ${files.length} files...\n`);
  
  files.forEach(file => scanFile(file));
  
  generateReport();
}

// Run the audit
main();
