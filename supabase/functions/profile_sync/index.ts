import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { clerkUserId, email, firstName, lastName, imageUrl, clerkRole } = await req.json();

    console.log('profile_sync: syncing user', { clerkUserId, email, clerkRole });

    // 1. Upsert profile
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
      throw new Error(`Profile upsert failed: ${profileError?.message}`);
    }

    const profileId = profile.id;

    // 2. Sync role if provided
    let finalRole = clerkRole;
    if (clerkRole) {
      await supabase.from('user_roles').delete().eq('user_id', profileId);
      await supabase.from('user_roles').insert({ user_id: profileId, role: clerkRole });
    } else {
      // Check existing role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profileId)
        .maybeSingle();
      
      finalRole = existingRole?.role || null;
    }

    // 3. Dev/First-user safeguard: seed owner if no owners exist
    const { data: owners } = await supabase
      .from('user_roles')
      .select('id')
      .eq('role', 'owner')
      .limit(1);

    if (!owners || owners.length === 0) {
      console.log('profile_sync: No owners found, seeding current user as owner');
      await supabase.from('user_roles').delete().eq('user_id', profileId);
      await supabase.from('user_roles').insert({ user_id: profileId, role: 'owner' });
      finalRole = 'owner';
    }

    console.log('profile_sync: Success', { profileId, role: finalRole });

    return new Response(
      JSON.stringify({ success: true, profileId, role: finalRole }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('profile_sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
