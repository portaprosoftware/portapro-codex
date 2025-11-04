const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  Vary: "Origin",
};

async function createClerkInvite(organizationId, payload) {
  const res = await fetch(
    `https://api.clerk.com/v1/organizations/${organizationId}/invitations`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("CLERK_SECRET_KEY") ?? ""}`,
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ Clerk invite failed", {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    return {
      ok: false,
      status: res.status,
      detail: text,
    };
  }

  const data = await res.json().catch(() => ({}));
  return { ok: true, data };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const body = await req.json();
    const { organizationId, email, role } = body ?? {};

    if (!organizationId || !email) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing organizationId or email" }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Map internal roles to Clerk roles
    let clerkRole = role;
    
    // Match Lovable roles to Clerk roles
    if (role === "admin" || role === "owner") clerkRole = "owner";
    
    // Optional fallback for now (to avoid future errors)
    if (["dispatcher", "driver", "customer"].includes(role)) clerkRole = "owner";

    const result = await createClerkInvite(organizationId, {
      email_address: email,
      role: clerkRole,
    });

    if (!result.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create Clerk invite",
          detail: { status: result.status, body: result.detail },
        }),
        { status: result.status, headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { status: 200, headers: corsHeaders }
    );
  } catch (e) {
    console.error("❌ org-invite unhandled error", {
      message: e?.message,
      stack: e?.stack,
    });
    return new Response(
      JSON.stringify({ success: false, error: "Unhandled error" }),
      { status: 500, headers: corsHeaders }
    );
  }
});
