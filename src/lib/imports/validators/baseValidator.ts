import { ImportFieldError } from "../errors.js";

const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;
const PROHIBITED_PREFIXES = ["=", "+", "-", "@"]; 

export type ValidationResult<T> =
  | { ok: true; record: T }
  | { ok: false; errors: ImportFieldError[] };

export type ForeignKeyRule<T> = { field: keyof T & string; table: string; message?: string };

export type ValidatorConfig<T> = {
  allowedFields: (keyof T & string)[];
  requiredFields: (keyof T & string)[];
  uuidFields?: (keyof T & string)[];
  numericFields?: (keyof T & string)[];
  foreignKeys?: ForeignKeyRule<T>[];
};

const sanitizeValue = (value: unknown, field: string, row: number): string | ImportFieldError => {
  if (value === undefined || value === null) return "";
  const str = String(value).trim();
  const numeric = /^[+-]?\d+(\.\d+)?$/;
  if (PROHIBITED_PREFIXES.some((prefix) => str.startsWith(prefix)) && !numeric.test(str)) {
    return { row, field, error: "Unsafe characters detected" };
  }
  return str;
};

const parseNumber = (value: string, field: string, row: number): number | ImportFieldError => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return { row, field, error: "Value must be a number" };
  }
  return parsed;
};

const parseUuid = (value: string, field: string, row: number): string | ImportFieldError => {
  if (!value) return { row, field, error: "Value is required" };
  if (!UUID_REGEX.test(value)) {
    return { row, field, error: "Value must be a valid UUID" };
  }
  return value;
};

export const createValidator = <T extends Record<string, any>>(config: ValidatorConfig<T>) => {
  return {
    foreignKeys: config.foreignKeys ?? [],
    validateRecord: (record: Record<string, any>, orgId: string, row = 1): ValidationResult<T> => {
      const errors: ImportFieldError[] = [];
      const sanitized: Record<string, any> = { organization_id: orgId };

      const unknownFields = Object.keys(record).filter(
        (key) => !config.allowedFields.includes(key as keyof T & string)
      );
      if (unknownFields.length) {
        errors.push(
          ...unknownFields.map((field) => ({
            row,
            field,
            error: "Unexpected column",
          }))
        );
      }

      for (const field of config.requiredFields) {
        const value = record[field];
        if (value === undefined || value === null || String(value).trim() === "") {
          errors.push({ row, field, error: "Field is required" });
        }
      }

      if (errors.length) {
        return { ok: false, errors };
      }

      for (const field of config.allowedFields) {
        const rawValue = record[field];
        const sanitizedValue = sanitizeValue(rawValue, field, row);
        if (typeof sanitizedValue !== "string") {
          errors.push(sanitizedValue);
          continue;
        }

        if (config.uuidFields?.includes(field)) {
          const uuid = parseUuid(sanitizedValue, field, row);
          if (typeof uuid !== "string") {
            errors.push(uuid);
            continue;
          }
          sanitized[field] = uuid;
          continue;
        }

        if (config.numericFields?.includes(field)) {
          const numeric = parseNumber(sanitizedValue, field, row);
          if (typeof numeric !== "number") {
            errors.push(numeric);
            continue;
          }
          sanitized[field] = numeric;
          continue;
        }

        sanitized[field] = sanitizedValue;
      }

      if (errors.length) {
        return { ok: false, errors };
      }

      return { ok: true, record: sanitized as T };
    },
  };
};
