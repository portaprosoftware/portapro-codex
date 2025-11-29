import { ImportError } from "./errors.js";

export type ParsedCsvResult = {
  rows: Record<string, string>[];
  fields: string[];
};

const DEFAULT_MAX_ROWS = 5000;
const DEFAULT_MAX_COLUMNS = 50;
const FORMULA_PREFIXES = ["=", "+", "-", "@"]; 

const splitCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      const isEscapedQuote = inQuotes && line[i + 1] === '"';
      if (isEscapedQuote) {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
};

const assertUtf8 = (content: string) => {
  const buffer = Buffer.from(content, "utf8");
  if (buffer.toString("utf8") !== content) {
    throw new ImportError("CSV is not valid UTF-8");
  }
};

const sanitizeCell = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const numeric = /^[+-]?\d+(\.\d+)?$/;
  if (FORMULA_PREFIXES.some((prefix) => trimmed.startsWith(prefix)) && !numeric.test(trimmed)) {
    throw new ImportError("CSV contains potential formula injection payloads");
  }
  return trimmed;
};

export const parseCsv = (
  content: string,
  options?: { maxRows?: number; maxColumns?: number }
): ParsedCsvResult => {
  if (!content || typeof content !== "string") {
    throw new ImportError("CSV content is required");
  }

  const maxRows = options?.maxRows ?? DEFAULT_MAX_ROWS;
  const maxColumns = options?.maxColumns ?? DEFAULT_MAX_COLUMNS;

  assertUtf8(content);

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new ImportError("CSV is empty");
  }

  const header = splitCsvLine(lines[0]).map((value) => value.trim());

  if (header.length === 0) {
    throw new ImportError("CSV is missing headers");
  }

  if (header.length > maxColumns) {
    throw new ImportError(`CSV exceeds maximum column limit (${maxColumns})`);
  }

  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (rows.length >= maxRows) {
      throw new ImportError(`CSV exceeds maximum row limit (${maxRows})`);
    }

    const rawLine = lines[i];
    if (!rawLine) continue;

    const cells = splitCsvLine(rawLine);
    if (cells.length !== header.length) {
      throw new ImportError(
        `Row ${i + 1} has ${cells.length} columns but expected ${header.length}`
      );
    }

    const record: Record<string, string> = {};
    header.forEach((field, index) => {
      record[field] = sanitizeCell(cells[index] ?? "");
    });
    rows.push(record);
  }

  return { rows, fields: header };
};
