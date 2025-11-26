import { getAppRootUrl, getMarketingUrl, getRootDomain } from './env';

export { getRootDomain, getMarketingUrl, getAppRootUrl };

export const buildTenantUrl = (orgSlug: string) => {
  const slug = orgSlug.trim().toLowerCase();
  return `https://${slug}.${getRootDomain()}`;
};
