import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/integrations/supabase/types";

const loadEnv = () => {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY } = process.env;

  const url = SUPABASE_URL ?? VITE_SUPABASE_URL;
  const serviceRole = SUPABASE_SERVICE_ROLE_KEY ?? VITE_SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error("Supabase URL is not configured");
  }

  if (!serviceRole) {
    throw new Error("Supabase service role key is not configured");
  }

  return { url, serviceRole };
};

const createServiceRoleClient = () => {
  const env = loadEnv();

  return createClient<Database>(env.url, env.serviceRole, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const loadOrganizationFromRequest = async (explicitSlug?: string | null) => {
  const slug = explicitSlug?.trim();

  if (!slug) {
    throw new Error("Organization slug is required");
  }

  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("organizations")
    .select("id, subdomain, name, clerk_org_id")
    .eq("subdomain", slug)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Organization not found");
  }

  return data;
};
