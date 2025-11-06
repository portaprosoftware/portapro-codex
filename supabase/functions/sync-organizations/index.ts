import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Vary': 'Origin',
};

interface ClerkOrganization {
  id: string;
  name: string;
  slug: string;
  created_at: number;
  updated_at: number;
  public_metadata?: {
    subdomain?: string;
    [key: string]: any;
  };
}

/**
 * Sync Organizations from Clerk to Supabase
 * 
 * This edge function fetches all organizations from Clerk and syncs them
 * to the Supabase organizations table, preventing ID mismatches.
 * 
 * Usage:
 * POST /sync-organizations
 * Body: { "syncAll": true } or { "organizationIds": ["org_123", "org_456"] }
 */
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    console.log('sync-organizations: Starting sync process');

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const clerkSecretKey = Deno.env.get('CLERK_SECRET_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !clerkSecretKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { syncAll = true, organizationIds = [] } = await req.json().catch(() => ({ syncAll: true }));

    console.log('sync-organizations: Fetching organizations from Clerk', { syncAll, organizationIds });

    // Fetch organizations from Clerk API
    let clerkOrganizations: ClerkOrganization[] = [];
    
    if (syncAll) {
      // Fetch all organizations with pagination
      let offset = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const clerkResponse = await fetch(
          `https://api.clerk.com/v1/organizations?limit=${limit}&offset=${offset}`,
          {
            headers: {
              'Authorization': `Bearer ${clerkSecretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!clerkResponse.ok) {
          const errorText = await clerkResponse.text();
          console.error('sync-organizations: Clerk API error', { status: clerkResponse.status, error: errorText });
          throw new Error(`Clerk API error: ${clerkResponse.status} - ${errorText}`);
        }

        const data = await clerkResponse.json();
        clerkOrganizations = clerkOrganizations.concat(data.data || []);
        
        hasMore = data.total_count > offset + limit;
        offset += limit;

        console.log('sync-organizations: Fetched batch', { offset, total: data.total_count });
      }
    } else if (organizationIds.length > 0) {
      // Fetch specific organizations
      for (const orgId of organizationIds) {
        const clerkResponse = await fetch(
          `https://api.clerk.com/v1/organizations/${orgId}`,
          {
            headers: {
              'Authorization': `Bearer ${clerkSecretKey}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (clerkResponse.ok) {
          const org = await clerkResponse.json();
          clerkOrganizations.push(org);
        } else {
          console.warn('sync-organizations: Failed to fetch org', { orgId, status: clerkResponse.status });
        }
      }
    }

    console.log('sync-organizations: Total organizations fetched from Clerk', { count: clerkOrganizations.length });

    // Sync each organization to Supabase
    const syncResults = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as Array<{ orgId: string; error: string }>,
    };

    for (const clerkOrg of clerkOrganizations) {
      try {
        // Determine subdomain from slug or public_metadata
        const subdomain = clerkOrg.public_metadata?.subdomain || clerkOrg.slug;

        if (!subdomain) {
          console.warn('sync-organizations: No subdomain found for organization', { orgId: clerkOrg.id, name: clerkOrg.name });
          syncResults.failed++;
          syncResults.errors.push({
            orgId: clerkOrg.id,
            error: 'No subdomain available (missing slug and public_metadata.subdomain)',
          });
          continue;
        }

        // Check if organization exists
        const { data: existingOrg } = await supabase
          .from('organizations')
          .select('id, clerk_org_id')
          .eq('subdomain', subdomain)
          .maybeSingle();

        const orgData = {
          name: clerkOrg.name,
          subdomain: subdomain,
          clerk_org_id: clerkOrg.id,
          is_active: true,
          updated_at: new Date().toISOString(),
        };

        if (existingOrg) {
          // Update existing organization
          const { error: updateError } = await supabase
            .from('organizations')
            .update(orgData)
            .eq('id', existingOrg.id);

          if (updateError) {
            console.error('sync-organizations: Update failed', { orgId: clerkOrg.id, error: updateError });
            syncResults.failed++;
            syncResults.errors.push({ orgId: clerkOrg.id, error: updateError.message });
          } else {
            syncResults.updated++;
            console.log('sync-organizations: Updated organization', { 
              orgId: clerkOrg.id, 
              subdomain,
              previousClerkOrgId: existingOrg.clerk_org_id,
              newClerkOrgId: clerkOrg.id,
            });
          }
        } else {
          // Create new organization
          const { error: insertError } = await supabase
            .from('organizations')
            .insert({
              ...orgData,
              created_at: new Date().toISOString(),
            });

          if (insertError) {
            console.error('sync-organizations: Insert failed', { orgId: clerkOrg.id, error: insertError });
            syncResults.failed++;
            syncResults.errors.push({ orgId: clerkOrg.id, error: insertError.message });
          } else {
            syncResults.created++;
            console.log('sync-organizations: Created organization', { orgId: clerkOrg.id, subdomain });
          }
        }
      } catch (error: any) {
        console.error('sync-organizations: Unexpected error processing org', { orgId: clerkOrg.id, error: error.message });
        syncResults.failed++;
        syncResults.errors.push({ orgId: clerkOrg.id, error: error.message });
      }
    }

    console.log('sync-organizations: Sync complete', syncResults);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Organization sync completed',
        results: syncResults,
        timestamp: new Date().toISOString(),
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error: any) {
    console.error('sync-organizations: Fatal error', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Organization sync failed',
        details: error.stack,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
