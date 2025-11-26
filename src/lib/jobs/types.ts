export interface JobPayload {
  orgId: string;
  type: string;
  data: Record<string, any>;
}

export interface JobResult {
  success: boolean;
  error?: string;
}

export type JobHandler = (payload: JobPayload) => Promise<JobResult>;
