import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { loadServerEnv } from '@/lib/config/env';
import type { Database } from '@/integrations/supabase/types';
import type { JobPayload, JobResult } from './types';

type QueueBackend = 'table' | 'cron';

export type QueuedJob = JobPayload & { id?: string; attempts?: number | null };

const inMemoryQueue: QueuedJob[] = [];

const shouldUseMemoryQueue = () => process.env.NODE_ENV === 'test';

const backend = (process.env.JOB_QUEUE_BACKEND as QueueBackend) ?? 'table';

const createServiceRoleClient = () => {
  const env = loadServerEnv();

  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

const getMaxAttempts = () => {
  const raw = process.env.JOB_MAX_ATTEMPTS;
  const parsed = raw ? Number(raw) : null;
  return Number.isFinite(parsed) ? parsed : 5;
};

const normalizeJobPayload = (job: JobPayload): JobPayload => ({
  orgId: job.orgId,
  type: job.type,
  data: job.data ?? {},
});

export const enqueue = async (job: JobPayload) => {
  const payload = normalizeJobPayload(job);

  if (!payload.orgId) {
    throw new Error('orgId is required for all jobs');
  }

  if (backend === 'cron') {
    return trigger(payload);
  }

  if (shouldUseMemoryQueue()) {
    inMemoryQueue.push({ ...payload, id: crypto.randomUUID(), attempts: 0 });
    return;
  }

  const client = createServiceRoleClient();
  const { error } = await client.from('jobs_queue').insert({
    org_id: payload.orgId,
    type: payload.type,
    data: payload.data,
    attempts: 0,
  });

  if (error) {
    throw new Error(`Failed to enqueue job: ${error.message}`);
  }
};

export const dequeue = async (): Promise<QueuedJob | null> => {
  if (backend === 'cron') {
    return null;
  }

  if (shouldUseMemoryQueue()) {
    return inMemoryQueue.shift() ?? null;
  }

  const client = createServiceRoleClient();
  const { data, error } = await client
    .from('jobs_queue')
    .select('id, org_id, type, data, attempts')
    .is('locked_at', null)
    .order('created_at', { ascending: true })
    .limit(1);

  if (error) {
    console.error('Failed to pull from jobs_queue', error.message);
    return null;
  }

  const job = data?.[0];

  if (!job) {
    return null;
  }

  const { data: lockedJob, error: lockError } = await client
    .from('jobs_queue')
    .update({
      locked_at: new Date().toISOString(),
      attempts: (job.attempts ?? 0) + 1,
    })
    .eq('id', job.id)
    .select('id, org_id, type, data, attempts')
    .single();

  if (lockError || !lockedJob) {
    console.error('Failed to lock queued job', lockError?.message);
    return null;
  }

  return {
    id: lockedJob.id,
    orgId: lockedJob.org_id,
    type: lockedJob.type,
    data: lockedJob.data ?? {},
    attempts: lockedJob.attempts,
  };
};

export const markComplete = async (id?: string, result?: JobResult) => {
  if (!id) return;

  if (backend === 'cron') {
    return;
  }

  if (shouldUseMemoryQueue()) {
    return;
  }

  const client = createServiceRoleClient();
  const { error } = await client.from('jobs_queue').delete().eq('id', id);

  if (error) {
    console.error('Failed to mark job complete', error.message, result);
  }
};

export const markFailed = async (id?: string, errorMessage?: string) => {
  if (!id) return;

  if (backend === 'cron') {
    return;
  }

  if (shouldUseMemoryQueue()) {
    return;
  }

  const client = createServiceRoleClient();
  const maxAttempts = getMaxAttempts();
  const { data, error } = await client
    .from('jobs_queue')
    .select('attempts')
    .eq('id', id)
    .limit(1);

  if (error) {
    console.error('Failed to fetch job attempts', error.message);
    return;
  }

  const attempts = data?.[0]?.attempts ?? 0;

  if (attempts >= maxAttempts) {
    const { error: deleteError } = await client.from('jobs_queue').delete().eq('id', id);
    if (deleteError) {
      console.error('Failed to purge failed job', deleteError.message, errorMessage);
    }
    return;
  }

  const { error: unlockError } = await client
    .from('jobs_queue')
    .update({ locked_at: null })
    .eq('id', id);

  if (unlockError) {
    console.error('Failed to reset job lock', unlockError.message, errorMessage);
  }
};

export const trigger = async (job: JobPayload) => {
  const payload = normalizeJobPayload(job);

  if (shouldUseMemoryQueue()) {
    inMemoryQueue.push({ ...payload, id: crypto.randomUUID(), attempts: 0 });
    return;
  }

  const env = loadServerEnv();
  const target = process.env.JOB_DISPATCHER_URL ?? `${env.SUPABASE_URL}/functions/v1/job-dispatcher`;

  try {
    await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('Failed to trigger edge job', error);
  }
};

export const __resetQueueForTests = () => {
  inMemoryQueue.length = 0;
};
