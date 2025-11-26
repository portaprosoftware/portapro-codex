import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { envServer } from '@/env.server';
import type { Database } from '@/integrations/supabase/types';
import { setOrgContext } from '@/lib/orgContext';

const MARKETING_SITE = 'https://portaprosoftware.com';

const resolveSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) {
    throw new Error('Supabase URL is not configured');
  }
  return url;
};

const createServiceRoleClient = () => {
  const supabaseUrl = resolveSupabaseUrl();
  return createClient<Database>(supabaseUrl, envServer.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export async function getOrganizationBySlug(slug?: string | null) {
  if (!slug) {
    redirect(MARKETING_SITE);
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, subdomain, name, clerk_org_id')
    .eq('subdomain', slug!)
    .maybeSingle();

  if (error || !data) {
    redirect(MARKETING_SITE);
  }

  setOrgContext({ organizationId: data.id, orgSlug: data.subdomain });
  return data;
}

export const loadOrganizationFromRequest = async (explicitSlug?: string | null) => {
  let slug = explicitSlug;

  if (!slug) {
    try {
      const requestHeaders = headers();
      slug = requestHeaders.get('x-org-slug');
    } catch {
      slug = null;
    }
  }

  return getOrganizationBySlug(slug);
};
