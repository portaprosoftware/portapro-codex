import type { JobHandler } from '../types';

export const routePrebuildJob: JobHandler = async ({ orgId }) => {
  if (!orgId) {
    return { success: false, error: 'Missing orgId' };
  }

  return { success: true };
};
