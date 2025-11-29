import { describe, expect, it, vi, afterEach } from "vitest";
import { AuthorizationError, requireRole as originalRequireRole } from "@/lib/authz/requireRole.js";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "./tenantMutations.js";

vi.mock("@/lib/audit/logger.js", () => ({
  logAction: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/audit/securityLogger.js", () => ({
  logSecurityEvent: vi.fn().mockResolvedValue(undefined),
}));

const createSupabaseMock = () => {
  const insert = vi.fn().mockResolvedValue({ data: { id: "cust-1" }, error: null });
  const eqUpdate = vi.fn().mockResolvedValue({ data: { id: "cust-1" }, error: null });
  const eqDelete = vi.fn().mockResolvedValue({ data: null, error: null });

  const update = vi.fn(() => ({ eq: eqUpdate }));
  const remove = vi.fn(() => ({ eq: eqDelete }));

  const roleContext = { orgId: "org-1" };
  const roleMaybeSingle = vi.fn(() =>
    Promise.resolve({
      data:
        roleContext.orgId === "org-1"
          ? { id: "user-1", organization_id: "org-1", user_roles: [{ role: "admin" }] }
          : null,
      error: null,
    })
  );
  const eqRole = vi.fn((column: string, value: string) => {
    if (column === "organization_id") {
      roleContext.orgId = value;
    }
    return { eq: eqRole, maybeSingle: roleMaybeSingle };
  });
  const selectProfile = vi.fn(() => ({ eq: eqRole }));

  const from = vi.fn((table: string) => {
    if (table === "profiles") {
      return { select: selectProfile } as any;
    }

    return {
      insert,
      update,
      delete: remove,
    } as any;
  });

  return {
    from,
    _insert: insert,
    _updateEq: eqUpdate,
    _deleteEq: eqDelete,
  } as any;
};

describe("tenantMutations", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prevents mutations when role check fails", async () => {
    const supabase = createSupabaseMock();
    const requireRoleSpy = vi
      .spyOn(await import("@/lib/authz/requireRole"), "requireRole")
      .mockRejectedValue(new AuthorizationError("Insufficient role"));

    await expect(createCustomer({ userId: "user-1", orgId: "org-1", supabase }, { name: "Blocked" })).rejects.toThrow(
      "Insufficient role"
    );

    expect(supabase._insert).not.toHaveBeenCalled();
    expect(requireRoleSpy).toHaveBeenCalled();
  });

  it("allows create/update/delete when role passes", async () => {
    const supabase = createSupabaseMock();
    vi.spyOn(await import("@/lib/authz/requireRole"), "requireRole").mockResolvedValue(undefined);

    await expect(createCustomer({ userId: "user-1", orgId: "org-1", supabase }, { name: "Acme" })).resolves.toEqual({
      data: { id: "cust-1" },
      error: null,
    });

    await expect(updateCustomer({ userId: "user-1", orgId: "org-1", supabase }, { id: "cust-1", name: "New" })).resolves.toEqual(
      { data: { id: "cust-1" }, error: null }
    );

    await expect(deleteCustomer({ userId: "user-1", orgId: "org-1", supabase }, { id: "cust-1" })).resolves.toEqual({
      data: null,
      error: null,
    });

    expect(supabase._insert).toHaveBeenCalled();
    expect(supabase._updateEq).toHaveBeenCalledWith("organization_id", "org-1");
    expect(supabase._deleteEq).toHaveBeenCalledWith("organization_id", "org-1");
  });

  it("fails when orgId mismatches user membership", async () => {
    const supabase = createSupabaseMock();
    const module = await import("@/lib/authz/requireRole");
    vi.spyOn(module, "requireRole").mockImplementation((args) =>
      originalRequireRole({ ...args, supabase: createSupabaseMock() })
    );

    await expect(createCustomer({ userId: "user-1", orgId: "org-2", supabase }, { name: "Mismatch" })).rejects.toBeInstanceOf(
      AuthorizationError
    );

    expect(supabase._insert).not.toHaveBeenCalled();
  });
});
