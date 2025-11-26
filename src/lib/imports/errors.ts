export type ImportFieldError = {
  row: number;
  field: string;
  error: string;
};

export class ImportError extends Error {
  constructor(message: string, public details: ImportFieldError[] = []) {
    super(message);
    this.name = "ImportError";
  }
}

export const formatImportError = (error: unknown): ImportError => {
  if (error instanceof ImportError) return error;
  return new ImportError(error instanceof Error ? error.message : "Unknown import error");
};
