// supabase/functions/org-invite/index.ts
// Purpose: Create real Clerk org invites + log to Supabase (PortaPro)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create Supabase service client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    // Validate environment variables
    if (!clerkSecretKey) {
      console.error("❌ Missing CLERK_SECRET_KEY in Supabase function secrets");
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: "error",
          message: "Missing CLERK_SECRET_KEY" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ Missing Supabase credentials");
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: "error",
          message: "Missing Supabase credentials" 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body
    const { email, organizationId, org_slug, org_name, role = "member", env } = await req.json();

    if (!email || !organizationId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: "error",
          message: "Missing email or organizationId" 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("📨 Creating Clerk invite for:", email, "org:", organizationId, "role:", role);

    // Step 1: Create Clerk org invite via API
    const clerkRes = await fetch("https://api.clerk.com/v1/organization_invitations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email_address: email,
        organization_id: organizationId,
        role,
      }),
    });

    if (!clerkRes.ok) {
      const err = await clerkRes.json().catch(() => ({}));
      console.error("❌ Clerk invite failed:", err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: "error",
          message: "Failed to create Clerk invite",
          detail: err 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const clerkData = await clerkRes.json();
    console.log("✅ Clerk invite created:", clerkData.id);

    // Step 2: Log the invite to Supabase (optional - creates audit trail)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { error: dbError } = await supabase.from("org_invites").insert([
      {
        email,
        org_id: organizationId,
        org_slug: org_slug || null,
        org_name: org_name || null,
        role,
        status: "invited",
        clerk_invite_id: clerkData.id,
        environment: env || "prod",
        created_at: new Date().toISOString(),
      },
    ]);

    if (dbError) {
      console.warn("⚠️ Supabase logging failed:", dbError.message);
      // Don't fail the request if logging fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: "success",
        message: "Invite created successfully",
        clerk_invite: clerkData,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    console.error("❌ org-invite error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        status: "error",
        message: "Internal Server Error",
        detail: err.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
