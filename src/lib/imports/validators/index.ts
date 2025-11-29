import { customerValidator } from "./customers.validator.js";
import { invoiceValidator } from "./invoices.validator.js";
import { jobValidator } from "./jobs.validator.js";
import { productValidator } from "./products.validator.js";
import { unitValidator } from "./units.validator.js";
import { vehicleValidator } from "./vehicles.validator.js";
import { ForeignKeyRule, ValidationResult } from "./baseValidator.js";

export type ImportType = "customers" | "invoices" | "vehicles" | "units" | "jobs" | "products";

export type Validator<T> = {
  foreignKeys: ForeignKeyRule<T>[];
  validateRecord: (
    record: Record<string, any>,
    orgId: string,
    row?: number
  ) => ValidationResult<T>;
};

export type ValidatorMap = {
  customers: Validator<any>;
  invoices: Validator<any>;
  vehicles: Validator<any>;
  units: Validator<any>;
  jobs: Validator<any>;
  products: Validator<any>;
};

export const validators: ValidatorMap = {
  customers: customerValidator,
  invoices: invoiceValidator,
  vehicles: vehicleValidator,
  units: unitValidator,
  jobs: jobValidator,
  products: productValidator,
};

export const getValidator = (type: ImportType) => validators[type];
