import { exportTenantRows, ExportOptions } from "./baseExport.js";

const INVOICE_FIELDS = [
  "id",
  "customer_id",
  "job_id",
  "total",
  "balance",
  "status",
  "issued_at",
  "due_at",
];

export const exportInvoices = (options: ExportOptions) =>
  exportTenantRows("invoices", INVOICE_FIELDS, options);
