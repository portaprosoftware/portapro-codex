import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createRemoteJWKSet, jwtVerify } from 'https://deno.land/x/jose@v4.15.4/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyClerkToken(authHeader: string | null): Promise<{ ok: boolean; sub?: string; error?: string }> {
  try {
    if (!authHeader) return { ok: false, error: 'Missing Authorization header' };
    const token = authHeader.replace('Bearer ', '').trim();
    const jwksUrl = Deno.env.get('CLERK_JWKS_URL');
    if (!jwksUrl) return { ok: false, error: 'Missing CLERK_JWKS_URL secret' };

    const JWKS = createRemoteJWKSet(new URL(jwksUrl));
    const issuer = Deno.env.get('CLERK_ISSUER');

    const { payload } = await jwtVerify(token, JWKS, issuer ? { issuer } : {});
    return { ok: true, sub: String(payload.sub) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Invalid token' };
  }
}

function adminClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase service role configuration');
  return createClient(url, key);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await verifyClerkToken(req.headers.get('Authorization'));
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error || 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as string;
    const payload = body?.payload ?? {};

    const supabase = adminClient();

    if (action === 'create_signed_upload') {
      if (!payload?.path) throw new Error('Missing path');
      const { data, error } = await supabase.storage.from('vehicle-documents').createSignedUploadUrl(payload.path);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    if (action === 'create_signed_url') {
      if (!payload?.path) throw new Error('Missing path');
      const expiresIn = Number(payload?.expiresIn ?? 600);
      const { data, error } = await supabase.storage.from('vehicle-documents').createSignedUrl(payload.path, expiresIn);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true, data }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
