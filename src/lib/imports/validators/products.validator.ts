import { createValidator } from "./baseValidator";

export type ProductImport = {
  id?: string;
  name: string;
  price?: number;
  sku?: string;
  description?: string;
  organization_id: string;
};

export const productValidator = createValidator<ProductImport>({
  allowedFields: ["id", "name", "price", "sku", "description", "organization_id"],
  requiredFields: ["name"],
  uuidFields: ["id"],
  numericFields: ["price"],
});
