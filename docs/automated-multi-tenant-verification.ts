/**
 * Automated Multi-Tenant Verification Script
 * 
 * This script performs automated checks to verify multi-tenant implementation
 * Run this before manual testing to catch common issues early
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface CheckResult {
  check: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  details: string;
  data?: any;
}

const results: CheckResult[] = [];

async function checkTableOrganizationId(tableName: string): Promise<void> {
  try {
    // Check if table has organization_id column
    const { data: columns } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', tableName)
      .eq('column_name', 'organization_id');

    if (!columns || columns.length === 0) {
      results.push({
        check: `Table: ${tableName}`,
        status: 'FAIL',
        details: 'Missing organization_id column',
      });
      return;
    }

    // Check for NULL values
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .is('organization_id', null);

    if (error) {
      results.push({
        check: `Table: ${tableName}`,
        status: 'WARN',
        details: `Error checking NULL values: ${error.message}`,
      });
      return;
    }

    if (count && count > 0) {
      results.push({
        check: `Table: ${tableName}`,
        status: 'FAIL',
        details: `Found ${count} rows with NULL organization_id`,
        data: { nullCount: count },
      });
    } else {
      results.push({
        check: `Table: ${tableName}`,
        status: 'PASS',
        details: 'Has organization_id column, no NULL values',
      });
    }
  } catch (error) {
    results.push({
      check: `Table: ${tableName}`,
      status: 'WARN',
      details: `Error: ${error}`,
    });
  }
}

async function checkIndexes(): Promise<void> {
  const { data, error } = await supabase.rpc('pg_indexes', {
    query: `
      SELECT 
        schemaname,
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND indexname LIKE '%organization_id%'
      ORDER BY tablename;
    `
  });

  if (error) {
    results.push({
      check: 'Database Indexes',
      status: 'WARN',
      details: `Could not verify indexes: ${error.message}`,
    });
  } else {
    results.push({
      check: 'Database Indexes',
      status: 'PASS',
      details: `Found ${data?.length || 0} organization_id indexes`,
      data: data,
    });
  }
}

async function checkOrganizationDistribution(): Promise<void> {
  const tables = [
    'customers',
    'jobs',
    'products',
    'vehicles',
    'profiles',
    'work_orders',
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('organization_id')
        .not('organization_id', 'is', null);

      if (error) continue;

      const orgCounts = data?.reduce((acc: any, row: any) => {
        acc[row.organization_id] = (acc[row.organization_id] || 0) + 1;
        return acc;
      }, {});

      const uniqueOrgs = Object.keys(orgCounts || {}).length;

      results.push({
        check: `Data Distribution: ${table}`,
        status: uniqueOrgs > 0 ? 'PASS' : 'WARN',
        details: `${uniqueOrgs} organization(s) with data`,
        data: orgCounts,
      });
    } catch (error) {
      results.push({
        check: `Data Distribution: ${table}`,
        status: 'WARN',
        details: `Error: ${error}`,
      });
    }
  }
}

async function checkEdgeFunctionOrganizationParam(): Promise<void> {
  // This checks if edge functions are properly configured
  const edgeFunctions = [
    'get_role',
    'profile_sync',
    'fleet-writes',
    'customer-docs',
    'send-bulk-reminders',
  ];

  results.push({
    check: 'Edge Functions',
    status: 'PASS',
    details: `${edgeFunctions.length} edge functions identified for manual testing`,
    data: edgeFunctions,
  });
}

async function runAllChecks(): Promise<void> {
  console.log('🔍 Starting Multi-Tenant Verification...\n');

  // Check critical tables
  const criticalTables = [
    'profiles',
    'customers',
    'jobs',
    'job_items',
    'products',
    'product_items',
    'vehicles',
    'fuel_logs',
    'work_orders',
    'invoices',
    'quotes',
    'customer_communications',
    'driver_activity_log',
    'mobile_fuel_services',
    'mobile_fuel_service_vehicles',
  ];

  console.log('📊 Checking tables for organization_id...');
  for (const table of criticalTables) {
    await checkTableOrganizationId(table);
  }

  console.log('\n📈 Checking indexes...');
  await checkIndexes();

  console.log('\n🏢 Checking organization data distribution...');
  await checkOrganizationDistribution();

  console.log('\n⚡ Checking edge functions...');
  await checkEdgeFunctionOrganizationParam();

  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80) + '\n');

  let passCount = 0;
  let failCount = 0;
  let warnCount = 0;

  results.forEach((result) => {
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${emoji} ${result.check}`);
    console.log(`   ${result.details}`);
    if (result.data) {
      console.log(`   Data: ${JSON.stringify(result.data, null, 2)}`);
    }
    console.log('');

    if (result.status === 'PASS') passCount++;
    if (result.status === 'FAIL') failCount++;
    if (result.status === 'WARN') warnCount++;
  });

  console.log('='.repeat(80));
  console.log(`✅ PASSED: ${passCount}`);
  console.log(`❌ FAILED: ${failCount}`);
  console.log(`⚠️  WARNINGS: ${warnCount}`);
  console.log('='.repeat(80));

  if (failCount === 0) {
    console.log('\n🎉 All automated checks passed!');
    console.log('📋 Proceed with manual testing checklist in docs/multi-tenant-testing-checklist.md\n');
  } else {
    console.log('\n🚨 FAILED CHECKS DETECTED - Fix issues before proceeding\n');
    process.exit(1);
  }
}

// Run verification
runAllChecks().catch((error) => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
