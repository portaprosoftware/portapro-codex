import { createValidator, ForeignKeyRule } from "./baseValidator.js";

export type InvoiceImport = {
  id?: string;
  customer_id: string;
  job_id?: string;
  total?: number;
  balance?: number;
  status?: string;
  issued_at?: string;
  due_at?: string;
  organization_id: string;
};

const foreignKeys: ForeignKeyRule<InvoiceImport>[] = [
  { field: "customer_id", table: "customers", message: "customer_id does not belong to your organization." },
  { field: "job_id", table: "jobs", message: "job_id does not belong to your organization." },
];

export const invoiceValidator = createValidator<InvoiceImport>({
  allowedFields: [
    "id",
    "customer_id",
    "job_id",
    "total",
    "balance",
    "status",
    "issued_at",
    "due_at",
    "organization_id",
  ],
  requiredFields: ["customer_id"],
  uuidFields: ["id", "customer_id", "job_id"],
  numericFields: ["total", "balance"],
  foreignKeys,
});
