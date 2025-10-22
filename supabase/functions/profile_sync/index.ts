import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clerkUserId, email, firstName, lastName, imageUrl, clerkRole } = await req.json();

    if (!clerkUserId) {
      return new Response(
        JSON.stringify({ success: false, error: 'clerkUserId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('profile_sync: Starting sync', { clerkUserId, email, clerkRole });

    // Step 1: Upsert profile using service role (atomic operation)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: clerkUserId,
        email: email || null,
        first_name: firstName || null,
        last_name: lastName || null,
        image_url: imageUrl || null,
      }, {
        onConflict: 'clerk_user_id'
      })
      .select('id')
      .single();

    if (profileError || !profile) {
      console.error('profile_sync: Profile upsert failed', profileError);
      throw new Error(`Profile upsert failed: ${profileError?.message}`);
    }

    const profileId = profile.id;
    console.log('profile_sync: Profile upserted', { profileId });

    // Step 2: Determine final role
    let finalRole: string | null = null;

    // Priority 1: Use clerkRole from publicMetadata if provided
    if (clerkRole) {
      console.log('profile_sync: Role provided from Clerk publicMetadata', { clerkRole });
      
      // Delete existing role to avoid conflicts
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', profileId);

      if (deleteError) {
        console.error('profile_sync: Role delete failed', deleteError);
      }

      // Insert new role
      const { error: roleInsertError } = await supabase
        .from('user_roles')
        .insert({ user_id: profileId, role: clerkRole });

      if (roleInsertError) {
        console.error('profile_sync: Role insert failed', roleInsertError);
        throw new Error(`Role insert failed: ${roleInsertError.message}`);
      }

      finalRole = clerkRole;
      console.log('profile_sync: Role set from Clerk', { finalRole });
    } else {
      // Priority 2: Check if user already has a role in DB
      const { data: existingRole, error: roleSelectError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileId)
        .maybeSingle();

      if (roleSelectError) {
        console.error('profile_sync: Role select failed', roleSelectError);
      }

      if (existingRole?.role) {
        finalRole = existingRole.role;
        console.log('profile_sync: Existing role found in DB', { finalRole });
      } else {
        // Priority 3: First-user safeguard - seed owner if no owners exist
        const { data: owners, error: ownerCheckError } = await supabase
          .from('user_roles')
          .select('id')
          .eq('role', 'owner')
          .limit(1);

        if (ownerCheckError) {
          console.error('profile_sync: Owner check failed', ownerCheckError);
        }

        if (!owners || owners.length === 0) {
          console.log('profile_sync: No owners found, seeding current user as owner');
          
          const { error: ownerInsertError } = await supabase
            .from('user_roles')
            .insert({ user_id: profileId, role: 'owner' });

          if (ownerInsertError) {
            console.error('profile_sync: Owner role insert failed', ownerInsertError);
            throw new Error(`Owner role insert failed: ${ownerInsertError.message}`);
          }

          finalRole = 'owner';
          console.log('profile_sync: First user - owner role assigned');
        } else {
          console.log('profile_sync: No role assigned - admin must assign via UI');
          finalRole = null;
        }
      }
    }

    console.log('profile_sync: Sync complete', { profileId, finalRole });

    return new Response(
      JSON.stringify({ 
        success: true, 
        profileId, 
        role: finalRole 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('profile_sync: Fatal error', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Profile sync failed',
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
