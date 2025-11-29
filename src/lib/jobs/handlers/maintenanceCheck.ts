import type { JobHandler } from '../types.js';

export const maintenanceCheckJob: JobHandler = async ({ orgId }) => {
  if (!orgId) {
    return { success: false, error: 'Missing orgId' };
  }

  return { success: true };
};
