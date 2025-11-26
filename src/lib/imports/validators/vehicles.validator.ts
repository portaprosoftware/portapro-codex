import { createValidator } from "./baseValidator";

export type VehicleImport = {
  id?: string;
  name: string;
  plate?: string;
  type?: string;
  status?: string;
  organization_id: string;
};

export const vehicleValidator = createValidator<VehicleImport>({
  allowedFields: ["id", "name", "plate", "type", "status", "organization_id"],
  requiredFields: ["name"],
  uuidFields: ["id"],
});
