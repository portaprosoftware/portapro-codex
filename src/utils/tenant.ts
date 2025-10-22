export function getTenantSlugFromHost(hostname: string): string | null {
  // e.g. "smith-rentals.portaprosoftware.com" -> "smith-rentals"
  const ROOTS = new Set(["portaprosoftware.com", "www.portaprosoftware.com"]);
  if (!hostname) return null;
  const parts = hostname.split(".");
  if (parts.length < 3) return null; // no subdomain
  const root = parts.slice(-2).join(".");
  if (!ROOTS.has(root)) return null;
  return parts.slice(0, -2).join("."); // handle multi-dot subdomains if needed
}
