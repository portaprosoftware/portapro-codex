import { describe, expect, it } from "vitest";
import { AuthorizationError, requireRole } from "./requireRole";

const mockRoleClient = (role: string | null, orgId = "org-1") => {
  const maybeSingle = () =>
    Promise.resolve({
      data: role ? { id: "user-1", organization_id: orgId, user_roles: [{ role }] } : null,
      error: null,
    });
  const eq = () => ({ eq, maybeSingle });
  const select = () => ({ eq });

  return {
    from: () => ({ select }),
  } as any;
};

describe("requireRole", () => {
  it("throws when no user is provided", async () => {
    await expect(requireRole({ userId: null, orgId: "org-1", requiredRoles: ["admin"] })).rejects.toBeInstanceOf(AuthorizationError);
  });

  it("throws when user is not in organization", async () => {
    await expect(
      requireRole({ userId: "user-1", orgId: "org-1", requiredRoles: ["admin"], supabase: mockRoleClient(null) })
    ).rejects.toThrow("User is not a member of this organization");
  });

  it("throws when role is insufficient", async () => {
    await expect(
      requireRole({ userId: "user-1", orgId: "org-1", requiredRoles: ["admin"], supabase: mockRoleClient("customer") })
    ).rejects.toThrow("Insufficient role for this action");
  });

  it("rejects legacy roles", async () => {
    await expect(
      requireRole({ userId: "user-1", orgId: "org-1", requiredRoles: ["admin"], supabase: mockRoleClient("org:admin") })
    ).rejects.toThrow("Legacy roles are not supported");
  });

  it("passes when role is allowed", async () => {
    await expect(
      requireRole({ userId: "user-1", orgId: "org-1", requiredRoles: ["admin"], supabase: mockRoleClient("admin") })
    ).resolves.toBeUndefined();
  });
});
