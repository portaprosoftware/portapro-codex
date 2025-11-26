import { describe, expect, it, vi } from "vitest";
import { tenantTable, requireOrgId } from "./tenant";

describe("requireOrgId", () => {
  it("throws when orgId is missing", () => {
    expect(() => requireOrgId(null)).toThrow("Organization ID required");
    expect(() => requireOrgId("")).toThrow("Organization ID required");
  });

  it("returns a trimmed orgId", () => {
    expect(requireOrgId(" org-123 ")).toBe("org-123");
  });
});

describe("tenantTable", () => {
  it("injects organization_id when absent from payload", async () => {
    const insert = vi.fn().mockResolvedValue({ data: null, error: null });
    const from = vi.fn().mockReturnValue({ insert });
    const client = { from } as any;

    await tenantTable(client, "org-123", "customers").insert({ name: "Test Customer" });

    expect(from).toHaveBeenCalledWith("customers");
    expect(insert).toHaveBeenCalledWith({ name: "Test Customer", organization_id: "org-123" });
  });
});
