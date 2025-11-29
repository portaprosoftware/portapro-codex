import { resolveOrgId } from "../orgContext.js";
import type { AuditActionPayload, AuditContext, AuditRequestLike } from "./types.js";

const normalizeHeader = (request?: Request | AuditRequestLike | null, key?: string) => {
  if (!request || !key) return null;
  try {
    const headerValue = request.headers?.get(key);
    return headerValue ?? null;
  } catch (error) {
    console.warn("Failed to read request header", error);
    return null;
  }
};

const extractIpAddress = (request?: Request | AuditRequestLike | null): string | null => {
  const forwarded = normalizeHeader(request, "x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  const realIp = normalizeHeader(request, "x-real-ip");
  if (realIp) return realIp;

  return normalizeHeader(request, "cf-connecting-ip");
};

const extractUserAgent = (request?: Request | AuditRequestLike | null) =>
  normalizeHeader(request, "user-agent");

export const buildAuditContext = (payload: AuditActionPayload): AuditContext => {
  const resolvedOrgId = resolveOrgId(payload.orgId);
  return {
    orgId: resolvedOrgId,
    userId: payload.userId ?? null,
    ipAddress: extractIpAddress(payload.request),
    userAgent: extractUserAgent(payload.request),
  };
};
