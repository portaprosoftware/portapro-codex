import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types.js';
import { loadServerEnv } from '@/lib/config/env.js';
import type { JobResult } from './types.js';

const memoryRuns = new Set<string>();

const shouldUseMemoryStore = () => process.env.NODE_ENV === 'test';

const createServiceRoleClient = () => {
  const env = loadServerEnv();

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const hasRunBefore = async (jobId: string): Promise<boolean> => {
  if (shouldUseMemoryStore()) {
    return memoryRuns.has(jobId);
  }

  const client = createServiceRoleClient();
  const { data, error } = await client.from('job_runs').select('id').eq('job_id', jobId).limit(1);

  if (error) {
    console.error('Failed to check job_runs idempotency', error.message);
    return false;
  }

  return Boolean(data && data.length > 0);
};

export const markRun = async (jobId: string, orgId: string, result: JobResult) => {
  if (shouldUseMemoryStore()) {
    memoryRuns.add(jobId);
    return;
  }

  const client = createServiceRoleClient();
  const { error } = await client.from('job_runs').insert({
    job_id: jobId,
    org_id: orgId,
    processed_at: new Date().toISOString(),
    result,
  });

  if (error) {
    console.error('Failed to record job run', error.message);
  }
};

export const __resetIdempotencyCacheForTests = () => memoryRuns.clear();
