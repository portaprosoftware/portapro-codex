import { createValidator, ForeignKeyRule } from "./baseValidator.js";

export type UnitImport = {
  id?: string;
  vehicle_id?: string;
  serial: string;
  status?: string;
  location?: string;
  organization_id: string;
};

const foreignKeys: ForeignKeyRule<UnitImport>[] = [
  { field: "vehicle_id", table: "vehicles", message: "vehicle_id does not belong to your organization." },
];

export const unitValidator = createValidator<UnitImport>({
  allowedFields: ["id", "vehicle_id", "serial", "status", "location", "organization_id"],
  requiredFields: ["serial"],
  uuidFields: ["id", "vehicle_id"],
  foreignKeys,
});
