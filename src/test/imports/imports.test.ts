import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/imports/csvParser";
import { runImport } from "@/lib/imports/importOrchestrator";
import type { ImportFieldError } from "@/lib/imports/errors";

class MockQuery {
  constructor(
    private table: string,
    private orgId: string,
    private storage: Record<string, any[]>,
    private inserted: Record<string, any[]>,
    private filters: Record<string, any> = {}
  ) {}

  select(_columns?: string) {
    return this;
  }

  eq(column: string, value: any) {
    this.filters[column] = value;
    return this;
  }

  maybeSingle() {
    const rows = (this.storage[this.table] || []).filter((row) => {
      return Object.entries(this.filters).every(([key, val]) => row[key] === val);
    });
    return Promise.resolve({ data: rows[0] ?? null, error: null });
  }

  order() {
    return Promise.resolve({ data: this.storage[this.table] || [], error: null });
  }

  insert(values: any) {
    const rows = Array.isArray(values) ? values : [values];
    this.inserted[this.table] = [...(this.inserted[this.table] || []), ...rows];
    return Promise.resolve({ data: rows, error: null });
  }
}

class MockSupabaseClient {
  public storage: Record<string, any[]> = {};
  public inserted: Record<string, any[]> = {};
  public rpcCalls: { fn: string; payload: any }[] = [];
  constructor(seed: Record<string, any[]> = {}) {
    this.storage = seed;
  }

  from(table: string) {
    return new MockQuery(table, "org-1", this.storage, this.inserted);
  }

  rpc(fn: string, payload: any) {
    this.rpcCalls.push({ fn, payload });
    this.inserted[payload.target_table] = [
      ...(this.inserted[payload.target_table] || []),
      ...(payload.records || []),
    ];
    return Promise.resolve({ data: payload.records, error: null });
  }
}

describe("CSV parsing", () => {
  it("rejects unsafe characters", () => {
    expect(() => parseCsv("name\n=CMD")).toThrow();
  });
});

describe("Import orchestrator", () => {
  const goodCustomerCsv = "name,email\nAcme,team@acme.com";

  it("imports valid rows atomically", async () => {
    const client = new MockSupabaseClient();
    const parsed = parseCsv(goodCustomerCsv);

    const result = await runImport({
      type: "customers",
      orgId: "org-1",
      userId: "user-1",
      rows: parsed.rows,
      supabase: client as any,
      useRpcAtomic: false,
    });

    expect(result.ok).toBe(true);
    expect(result.inserted).toBe(1);
    expect(client.inserted.customers?.length).toBe(1);
    const auditEntries = client.inserted["import_audit_log"] || [];
    expect(auditEntries.length).toBe(1);
    expect(auditEntries[0].success_rows).toBe(1);
  });

  it("rolls back when any row fails validation", async () => {
    const client = new MockSupabaseClient();
    const parsed = parseCsv("name,email\nAcme,team@acme.com\n,missing@example.com");

    const result = await runImport({
      type: "customers",
      orgId: "org-1",
      rows: parsed.rows,
      supabase: client as any,
      useRpcAtomic: false,
    });

    expect(result.ok).toBe(false);
    expect(client.inserted.customers).toBeUndefined();
    expect(result.errors?.some((err) => err.field === "name" && err.row === 3)).toBe(true);
  });

  it("rejects cross-tenant references", async () => {
    const client = new MockSupabaseClient({
      customers: [{ id: "00000000-0000-0000-0000-000000000001", organization_id: "org-2" }],
    });

    const parsed = parseCsv(
      "customer_id,total\n00000000-0000-0000-0000-000000000001,20"
    );

    const result = await runImport({
      type: "invoices",
      orgId: "org-1",
      rows: parsed.rows,
      supabase: client as any,
      useRpcAtomic: false,
    });

    expect(result.ok).toBe(false);
    expect((result.errors as ImportFieldError[])[0].field).toBe("customer_id");
  });

  it("rejects extra columns", async () => {
    const client = new MockSupabaseClient();
    const parsed = parseCsv("name,unexpected\nAcme,noop");

    const result = await runImport({
      type: "customers",
      orgId: "org-1",
      rows: parsed.rows,
      supabase: client as any,
      useRpcAtomic: false,
    });

    expect(result.ok).toBe(false);
    expect(result.errors?.[0].field).toBe("unexpected");
  });

  it("rejects unsafe values even when parse succeeds", async () => {
    const client = new MockSupabaseClient();
    const result = await runImport({
      type: "customers",
      orgId: "org-1",
      rows: [{ name: "=CMD", email: "alert@example.com" }],
      supabase: client as any,
      useRpcAtomic: false,
    });

    expect(result.ok).toBe(false);
    expect(result.errors?.some((err) => err.field === "name")).toBe(true);
  });
});
