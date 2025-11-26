import crypto from 'crypto';
import path from 'path';
import { pathToFileURL } from 'url';
import { dequeue, markComplete, markFailed, QueuedJob } from './queue';
import { getJobHandler } from './registry';
import { hasRunBefore, markRun } from './idempotency';
import type { JobPayload, JobResult } from './types';
import { logAction } from '../audit/logger';
import { logSecurityEvent } from '../audit/securityLogger';

type ExecutorStatus =
  | { status: 'completed'; result: JobResult }
  | { status: 'failed'; reason: string; result?: JobResult }
  | { status: 'duplicate' }
  | { status: 'skipped'; reason: string };

const backend = (process.env.JOB_QUEUE_BACKEND as 'table' | 'cron') ?? 'table';

const isValidOrgId = (orgId?: string | null): orgId is string => typeof orgId === 'string' && orgId.trim().length > 0;

export const deriveJobId = (payload: JobPayload) =>
  crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');

const recordCompletion = async (jobId: string | undefined, result: JobResult) => {
  if (!jobId) return;
  await markComplete(jobId, result);
};

const recordFailure = async (jobId: string | undefined, errorMessage: string) => {
  if (!jobId) return;
  await markFailed(jobId, errorMessage);
};

export const processJob = async (job: QueuedJob): Promise<ExecutorStatus> => {
  if (!isValidOrgId(job.orgId)) {
    await recordFailure(job.id, 'Missing or invalid orgId');
    await logSecurityEvent({
      orgId: job.orgId,
      type: 'missing_org_id',
      source: 'job_executor',
      metadata: { jobId: job.id, type: job.type },
    });
    return { status: 'skipped', reason: 'invalid_org' };
  }

  const payload: JobPayload = {
    orgId: job.orgId,
    type: job.type,
    data: job.data ?? {},
  };

  const jobId = deriveJobId(payload);

  const alreadyHandled = await hasRunBefore(jobId);
  if (alreadyHandled) {
    await recordCompletion(job.id, { success: true, error: 'duplicate run ignored' });
    await logAction({
      orgId: payload.orgId,
      action: 'job_duplicate',
      entityType: 'job',
      entityId: job.id,
      metadata: { type: payload.type },
    });
    return { status: 'duplicate' };
  }

  const handler = getJobHandler(payload.type);

  if (!handler) {
    await recordFailure(job.id, `No handler registered for ${payload.type}`);
    await logSecurityEvent({
      orgId: payload.orgId,
      type: 'job_missing_handler',
      source: 'job_executor',
      metadata: { jobId: job.id, type: payload.type },
    });
    return { status: 'failed', reason: 'missing_handler' };
  }

  let result: JobResult;

  try {
    await logAction({
      orgId: payload.orgId,
      action: 'job_start',
      entityType: 'job',
      entityId: job.id,
      metadata: { type: payload.type },
    });
    result = await handler(payload);
  } catch (error) {
    await recordFailure(job.id, error instanceof Error ? error.message : 'Unknown job error');
    await logAction({
      orgId: payload.orgId,
      action: 'job_failed',
      entityType: 'job',
      entityId: job.id,
      metadata: { type: payload.type, error: error instanceof Error ? error.message : 'unknown' },
    });
    return { status: 'failed', reason: 'handler_error' };
  }

  await markRun(jobId, payload.orgId, result);

  if (result.success) {
    await recordCompletion(job.id, result);
    await logAction({
      orgId: payload.orgId,
      action: 'job_completed',
      entityType: 'job',
      entityId: job.id,
      metadata: { type: payload.type },
    });
    return { status: 'completed', result };
  }

  await recordFailure(job.id, result.error ?? 'Job failed');
  await logAction({
    orgId: payload.orgId,
    action: 'job_failed',
    entityType: 'job',
    entityId: job.id,
    metadata: { type: payload.type, error: result.error ?? 'Job failed' },
  });
  return { status: 'failed', reason: 'job_failed', result };
};

export const processNextJob = async () => {
  const job = await dequeue();
  if (!job) return null;
  return processJob(job);
};

export const startExecutor = async () => {
  if (backend !== 'table') {
    return;
  }

  const interval = Number.isFinite(Number(process.env.JOB_POLL_INTERVAL_MS))
    ? Number(process.env.JOB_POLL_INTERVAL_MS)
    : 2000;

  setInterval(() => {
    processNextJob().catch((error) => console.error('Job executor error', error));
  }, interval);
};

const shouldAutoRun = () => {
  try {
    const executedFile = process.argv[1];
    if (!executedFile) return false;

    const resolvedPath = path.isAbsolute(executedFile)
      ? executedFile
      : path.join(process.cwd(), executedFile);

    return import.meta.url === pathToFileURL(resolvedPath).href;
  } catch (error) {
    console.error('Executor auto-run detection failed', error);
    return false;
  }
};

if (shouldAutoRun()) {
  startExecutor().catch((error) => console.error('Failed to start executor', error));
}
