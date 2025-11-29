import { exportTenantRows, ExportOptions } from "./baseExport.js";

const UNIT_FIELDS = ["id", "vehicle_id", "serial", "status", "location"];

export const exportUnits = (options: ExportOptions) =>
  exportTenantRows("units", UNIT_FIELDS, options);
