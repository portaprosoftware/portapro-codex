import { createValidator, ForeignKeyRule } from "./baseValidator";

export type JobImport = {
  id?: string;
  customer_id: string;
  unit_id?: string;
  vehicle_id?: string;
  status?: string;
  scheduled_at?: string;
  notes?: string;
  organization_id: string;
};

const foreignKeys: ForeignKeyRule<JobImport>[] = [
  { field: "customer_id", table: "customers", message: "customer_id does not belong to your organization." },
  { field: "unit_id", table: "units", message: "unit_id does not belong to your organization." },
  { field: "vehicle_id", table: "vehicles", message: "vehicle_id does not belong to your organization." },
];

export const jobValidator = createValidator<JobImport>({
  allowedFields: [
    "id",
    "customer_id",
    "unit_id",
    "vehicle_id",
    "status",
    "scheduled_at",
    "notes",
    "organization_id",
  ],
  requiredFields: ["customer_id"],
  uuidFields: ["id", "customer_id", "unit_id", "vehicle_id"],
  foreignKeys,
});
