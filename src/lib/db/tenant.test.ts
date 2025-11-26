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
  it("applies organization_id filter on select", () => {
    const mockEq = vi.fn();
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({
      select: mockSelect,
    });

    const mockClient = {
      from: mockFrom,
    } as any;

    const table = tenantTable(mockClient, "org-123", "test_table");

    table.select("*");

    expect(mockFrom).toHaveBeenCalledWith("test_table");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(mockEq).toHaveBeenCalledWith("organization_id", "org-123");
  });

  it("adds organization_id on insert", () => {
    const mockInsert = vi.fn();
    const mockFrom = vi.fn().mockReturnValue({
      insert: mockInsert,
    });

    const mockClient = {
      from: mockFrom,
    } as any;

    const table = tenantTable(mockClient, "org-123", "test_table");

    table.insert({ name: "Test" }, { returning: "representation" });

    expect(mockInsert).toHaveBeenCalledWith(
      { name: "Test", organization_id: "org-123" },
      { returning: "representation" }
    );
  });

  it("injects organization_id when absent from payload in multi-record inserts", async () => {
    const mockInsert = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockFrom = vi.fn().mockReturnValue({ insert: mockInsert });

    const mockClient = { from: mockFrom } as any;

    await tenantTable(mockClient, "org-123", "customers").insert([
      { name: "A" },
      { name: "B" },
    ]);

    expect(mockInsert).toHaveBeenCalledWith([
      { name: "A", organization_id: "org-123" },
      { name: "B", organization_id: "org-123" },
    ]);
  });
});
