import { exportTenantRows, ExportOptions } from "./baseExport.js";

const CUSTOMER_FIELDS = [
  "id",
  "name",
  "email",
  "phone",
  "address",
  "city",
  "state",
  "postal_code",
  "balance",
  "deposit",
  "notes",
];

export const exportCustomers = (options: ExportOptions) =>
  exportTenantRows("customers", CUSTOMER_FIELDS, options);
