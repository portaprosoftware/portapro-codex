import { clientEnv } from './env';

export const getRootDomain = () => clientEnv.NEXT_PUBLIC_ROOT_DOMAIN;

export const getMarketingUrl = () => clientEnv.NEXT_PUBLIC_MARKETING_URL;

export const getAppRootUrl = () => clientEnv.NEXT_PUBLIC_APP_ROOT_URL;

export const buildTenantUrl = (orgSlug: string) => {
  const slug = orgSlug.trim().toLowerCase();
  return `https://${slug}.${getRootDomain()}`;
};
