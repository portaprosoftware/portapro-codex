import { getAppRootUrl, getRootDomain } from '@/lib/config/domains';

const rootDomain = getRootDomain();
const APP_HOST = new URL(getAppRootUrl()).hostname;
const MARKETING_HOSTS = new Set([
  rootDomain,
  `www.${rootDomain}`,
]);

const SLUG_PATTERN = /^[a-z0-9-]+$/;

export function extractOrgSlug(host?: string | null): string | null {
  if (!host) return null;

  const normalizedHost = host.toLowerCase().split(":")[0].trim();
  if (!normalizedHost) return null;

  if (normalizedHost === "localhost" || normalizedHost.startsWith("127.")) {
    return null;
  }

  if (normalizedHost === APP_HOST || MARKETING_HOSTS.has(normalizedHost)) {
    return null;
  }

  if (!normalizedHost.endsWith(rootDomain)) {
    return null;
  }

  const parts = normalizedHost.split(".");
  if (parts.length < 3) {
    return null;
  }

  const slug = parts[0];
  if (!slug || !SLUG_PATTERN.test(slug) || slug === "app") {
    return null;
  }

  return slug;
}
