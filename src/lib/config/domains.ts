import { clientEnv } from './env';

export const getRootDomain = () => clientEnv.VITE_ROOT_DOMAIN;

export const getMarketingUrl = () => clientEnv.VITE_MARKETING_URL;

export const getAppRootUrl = () => clientEnv.NEXT_PUBLIC_APP_ROOT_URL;

export const buildTenantUrl = (orgSlug: string) => {
  const slug = orgSlug.trim().toLowerCase();
  return `https://${slug}.${getRootDomain()}`;
};
