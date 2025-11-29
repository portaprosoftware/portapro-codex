import { exportTenantRows, ExportOptions } from "./baseExport.js";

const JOB_FIELDS = [
  "id",
  "customer_id",
  "unit_id",
  "vehicle_id",
  "status",
  "scheduled_at",
  "notes",
];

export const exportJobs = (options: ExportOptions) =>
  exportTenantRows("jobs", JOB_FIELDS, options);
