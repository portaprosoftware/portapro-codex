import { createValidator } from "./baseValidator.js";

export type CustomerImport = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  balance?: number;
  deposit?: number;
  notes?: string;
  organization_id: string;
};

export const customerValidator = createValidator<CustomerImport>({
  allowedFields: [
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
    "organization_id",
  ],
  requiredFields: ["name"],
  uuidFields: ["id"],
  numericFields: ["balance", "deposit"],
});
