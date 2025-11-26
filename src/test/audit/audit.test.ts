import { describe, expect, it, vi } from "vitest";
import { logAction, getTenantAuditLogs } from "@/lib/audit/logger";
import { logSecurityEvent } from "@/lib/audit/securityLogger";

const createSupabaseMock = () => {
  const insert = vi.fn().mockResolvedValue({ data: null, error: null });
  const eq = vi.fn().mockReturnValue({ eq });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn(() => ({ insert, select, eq }));

  return {
    from,
    _insert: insert,
    _eq: eq,
    _select: select,
  } as any;
};

describe("audit logging", () => {
  it("records CRUD actions with request context", async () => {
    const mock = createSupabaseMock();
    const request = new Request("https://example.com", {
      headers: {
        "x-forwarded-for": "203.0.113.10",
        "user-agent": "vitest",
      },
    });

    const record = await logAction({
      orgId: "org-1",
      userId: "user-1",
      action: "create_customer",
      entityType: "customer",
      entityId: "cust-1",
      metadata: { plan: "pro" },
      request,
      supabase: mock,
    });

    expect(mock.from).toHaveBeenCalledWith("audit_logs");
    expect(mock._insert).toHaveBeenCalled();
    expect(record.ip_address).toBe("203.0.113.10");
    expect(record.user_agent).toBe("vitest");
  });

  it("logs cross-tenant attempts as security events", async () => {
    const mock = createSupabaseMock();

    const record = await logSecurityEvent({
      orgId: "org-1",
      type: "tenant_leak_attempt",
      source: "api",
      metadata: { attemptedResource: "invoice" },
      supabase: mock,
    });

    expect(mock.from).toHaveBeenCalledWith("security_events");
    expect(mock._insert).toHaveBeenCalledWith(expect.objectContaining(record));
  });

  it("logs token failures as security events", async () => {
    const mock = createSupabaseMock();

    await logSecurityEvent({
      orgId: "org-1",
      type: "invalid_token",
      source: "portal",
      metadata: { reason: "expired" },
      supabase: mock,
    });

    expect(mock._insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "invalid_token", source: "portal" })
    );
  });

  it("audits imports and exports", async () => {
    const mock = createSupabaseMock();

    await logAction({
      orgId: "org-1",
      action: "import_success",
      entityType: "customers",
      metadata: { totalRows: 10, successRows: 10, failedRows: 0 },
      supabase: mock,
    });

    expect(mock._insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "import_success",
        entity_type: "customers",
      })
    );
  });

  it("scopes audit log queries to org", async () => {
    const mock = createSupabaseMock();

    await getTenantAuditLogs("org-tenant", mock as any);

    expect(mock._select).toHaveBeenCalled();
    expect(mock._eq).toHaveBeenCalledWith("org_id", "org-tenant");
  });
});
