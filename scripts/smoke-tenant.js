#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const REQUIRED_ENV = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SMOKE_ORG_A_ID',
  'SMOKE_ORG_B_ID',
  'SMOKE_ROUTE_A_ID',
  'SMOKE_ROUTE_B_ID',
];

function ensureEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key] || process.env[key]?.trim().length === 0);

  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    orgA: process.env.SMOKE_ORG_A_ID,
    orgB: process.env.SMOKE_ORG_B_ID,
    routeA: process.env.SMOKE_ROUTE_A_ID,
    routeB: process.env.SMOKE_ROUTE_B_ID,
  };
}

function createSupabaseClient(url, key) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function fetchDashboardKpis(client, orgId) {
  const now = new Date();
  const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data, error } = await client.rpc('pp_get_dashboard_kpis', {
    p_organization_id: orgId,
    p_start: start.toISOString(),
    p_end: now.toISOString(),
  });

  if (error) {
    throw new Error(`Dashboard KPI RPC failed for org ${orgId}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Dashboard KPI RPC returned no data for org ${orgId}`);
  }

  return data;
}

async function fetchRouteManifest(client, orgId, routeId) {
  const { data, error } = await client.rpc('pp_get_route_manifest', {
    p_organization_id: orgId,
    p_route_id: routeId,
  });

  if (error) {
    throw new Error(`Route manifest RPC failed for org ${orgId}: ${error.message}`);
  }

  if (!Array.isArray(data)) {
    throw new Error(`Route manifest RPC returned unexpected shape for org ${orgId}`);
  }

  return data;
}

function assertManifestsIsolated(manifestA, manifestB, routeA, routeB) {
  const jobsA = new Set(manifestA.map((stop) => stop.job_id).filter(Boolean));
  const jobsB = new Set(manifestB.map((stop) => stop.job_id).filter(Boolean));
  const overlap = [...jobsA].filter((jobId) => jobsB.has(jobId));

  if (overlap.length > 0) {
    throw new Error(`Route manifests overlap across tenants for job IDs: ${overlap.join(', ')}`);
  }

  const routesAInvalid = manifestA.filter((stop) => stop.route_id !== routeA);
  const routesBInvalid = manifestB.filter((stop) => stop.route_id !== routeB);

  if (routesAInvalid.length > 0 || routesBInvalid.length > 0) {
    throw new Error('Route manifest contained records for the wrong route/tenant.');
  }
}

function assertKpisIsolated(kpisA, kpisB) {
  const normalizedA = JSON.stringify(kpisA);
  const normalizedB = JSON.stringify(kpisB);

  if (normalizedA === normalizedB) {
    throw new Error('Dashboard KPI responses are identical between org A and org B — possible tenant isolation issue.');
  }
}

async function main() {
  const env = ensureEnv();
  const client = createSupabaseClient(env.supabaseUrl, env.serviceRoleKey);

  console.log('🚦 Running tenant smoke tests...');

  const [kpisA, kpisB, manifestA, manifestB] = await Promise.all([
    fetchDashboardKpis(client, env.orgA),
    fetchDashboardKpis(client, env.orgB),
    fetchRouteManifest(client, env.orgA, env.routeA),
    fetchRouteManifest(client, env.orgB, env.routeB),
  ]);

  assertKpisIsolated(kpisA, kpisB);
  assertManifestsIsolated(manifestA, manifestB, env.routeA, env.routeB);

  if (manifestA.length === 0) {
    console.warn('⚠️  Org A manifest returned no stops. Ensure SMOKE_ROUTE_A_ID points to an active route.');
  }

  if (manifestB.length === 0) {
    console.warn('⚠️  Org B manifest returned no stops. Ensure SMOKE_ROUTE_B_ID points to an active route.');
  }

  console.log('✅ Tenant smoke test passed. RPC responses are isolated per organization.');
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
