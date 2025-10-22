import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  invitedBy: string;
  environment?: 'development' | 'production';
  redirectBase?: string;
  organizationId?: string;
}

const clerkSecretKeyProd = Deno.env.get('CLERK_SECRET_KEY');
const clerkSecretKeyDev = Deno.env.get('CLERK_SECRET_KEY_DEV');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Starting user invitation process...');
    
    const requestBody: InviteUserRequest = await req.json();
    const { email, firstName, lastName, role, phone, invitedBy, environment, redirectBase, organizationId } = requestBody;

    // Determine which Clerk key to use
    let clerkSecretKey: string | undefined;
    if (environment === 'development' && clerkSecretKeyDev) {
      clerkSecretKey = clerkSecretKeyDev;
      console.log('Using Clerk development key');
    } else if (clerkSecretKeyProd) {
      clerkSecretKey = clerkSecretKeyProd;
      console.log('Using Clerk production key');
    } else {
      clerkSecretKey = clerkSecretKeyDev || clerkSecretKeyProd;
    }

    if (!clerkSecretKey) {
      console.error('No Clerk secret key available');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Clerk integration not configured. Please add CLERK_SECRET_KEY to edge function secrets.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!email || !firstName || !lastName || !role || !invitedBy) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: email, firstName, lastName, role, invitedBy' 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Inviting user: ${firstName} ${lastName} (${email}) with role: ${role}`);

    // Use explicit redirectBase from client, fallback to headers
    const origin = redirectBase || req.headers.get('origin') || req.headers.get('referer')?.split('/').slice(0, 3).join('/') || '';
    
    if (!origin) {
      console.error('No redirect base available');
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No redirect URL could be determined. Please try again.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate redirect URL hostname for security
    const redirectUrl = `${origin}/dashboard`;
    
    try {
      const url = new URL(redirectUrl);
      if (!url.hostname.endsWith('portaprosoftware.com') && !url.hostname.includes('localhost')) {
        console.error('Invalid redirect hostname:', url.hostname);
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Invalid redirect URL'
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (e) {
      console.error('Invalid redirect URL format:', redirectUrl);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid redirect URL format'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Using redirect URL:', redirectUrl);
    console.log('Organization ID:', organizationId || 'none (global invitation)');

    // Create Clerk invitation using appropriate API endpoint
    const isOrgInvitation = !!organizationId;
    const invitationEndpoint = isOrgInvitation
      ? `https://api.clerk.com/v1/organizations/${organizationId}/invitations`
      : 'https://api.clerk.com/v1/invitations';
    
    console.log(`Creating Clerk invitation via ${isOrgInvitation ? 'Organization' : 'Global'} API...`);
    console.log('Endpoint:', invitationEndpoint);
    
    const clerkResponse = await fetch(invitationEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email_address: email,
        public_metadata: {
          role: role,
          invited_by: invitedBy,
          first_name: firstName,
          last_name: lastName,
        },
        redirect_url: redirectUrl,
        notify: true, // Clerk will send the invitation email
      }),
    });

    if (!clerkResponse.ok) {
      const clerkError = await clerkResponse.text();
      console.error('Clerk invitation API error:', clerkError);
      throw new Error(`Clerk invitation failed: ${clerkError}`);
    }

    const clerkInvitation = await clerkResponse.json();
    console.log('Clerk invitation created:', clerkInvitation.id);

    // Store invitation record in Supabase for tracking
    console.log('Creating invitation record in Supabase...');
    const { data: invitation, error: invitationError } = await supabase
      .from('user_invitations')
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        role,
        status: 'pending',
        invited_by: invitedBy,
        invitation_token: clerkInvitation.id, // Use Clerk invitation ID
        clerk_user_id: null, // Will be set when user accepts
        sent_at: new Date().toISOString(),
        invitation_type: isOrgInvitation ? 'clerk_org_invitation' : 'clerk_invitation',
        metadata: {
          created_via: 'admin_invite',
          clerk_invitation_id: clerkInvitation.id,
          redirect_url: redirectUrl,
          organization_id: organizationId || null,
          invitation_endpoint: invitationEndpoint,
        }
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Supabase invitation error:', invitationError);
      // Don't fail the whole process - the Clerk invitation was sent
      console.warn('Continuing despite Supabase error - invitation was sent via Clerk');
    } else {
      console.log('Created invitation record:', invitation.id);
    }

    console.log('User invitation process completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Invitation sent successfully via Clerk',
        data: {
          invitationId: invitation?.id || clerkInvitation.id,
          clerkInvitationId: clerkInvitation.id,
          email,
          role,
          emailSent: true, // Clerk handles email sending
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('User invitation failed:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to invite user',
        details: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

serve(handler);
