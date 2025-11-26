import { describe, expect, beforeEach, it } from 'vitest';
import '@/lib/jobs';
import { deriveJobId, processJob } from '@/lib/jobs/executor';
import { __resetIdempotencyCacheForTests, hasRunBefore, markRun } from '@/lib/jobs/idempotency';
import { dequeue, enqueue, __resetQueueForTests } from '@/lib/jobs/queue';
import { getJobHandler } from '@/lib/jobs/registry';

const basePayload = {
  orgId: 'org-123',
  type: 'sendInvoiceReminder',
  data: { invoiceId: 'inv_1' },
};

describe('jobs framework', () => {
  beforeEach(() => {
    __resetQueueForTests();
    __resetIdempotencyCacheForTests();
    process.env.JOB_QUEUE_BACKEND = 'table';
  });

  it('can enqueue and dequeue jobs', async () => {
    await enqueue(basePayload);
    const job = await dequeue();

    expect(job?.orgId).toBe(basePayload.orgId);
    expect(job?.type).toBe(basePayload.type);
  });

  it('idempotency prevents duplicates', async () => {
    const jobId = deriveJobId(basePayload);
    expect(await hasRunBefore(jobId)).toBe(false);

    await markRun(jobId, basePayload.orgId, { success: true });
    expect(await hasRunBefore(jobId)).toBe(true);
  });

  it('job registry resolves handlers', () => {
    const handler = getJobHandler('sendInvoiceReminder');
    expect(handler).toBeTruthy();
  });

  it('skips jobs without an orgId', async () => {
    const result = await processJob({ ...basePayload, orgId: '', id: 'missing-org' } as any);
    expect(result.status).toBe('skipped');
  });

  it('fails gracefully on malformed payloads', async () => {
    const result = await processJob({ ...basePayload, type: 'unknownJob', id: 'missing-handler' });
    expect(result.status).toBe('failed');
  });
});
