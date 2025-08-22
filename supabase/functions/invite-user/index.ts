import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { Resend } from "npm:resend@2.0.0";

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
}

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
const clerkSecretKeyProd = Deno.env.get('CLERK_SECRET_KEY');
const clerkSecretKeyDev = Deno.env.get('CLERK_SECRET_KEY_DEV');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Small helper to call Clerk with a given key
async function clerkFetch(path: string, apiKey: string, init?: RequestInit) {
  const base = 'https://api.clerk.com';
  const headers = {
    ...(init?.headers || {}),
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  return await fetch(`${base}${path}`, { ...init, headers });
}

// Try to find an existing Clerk user by email
async function findClerkUserByEmail(email: string, primaryKey: string, secondaryKey?: string) {
  const tryWithKey = async (key: string) => {
    const resp = await clerkFetch(`/v1/users?email_address=${encodeURIComponent(email)}`, key, { method: 'GET' });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('Clerk search error:', errText);
      return null;
    }
    const users = await resp.json();
    return Array.isArray(users) && users.length > 0 ? users[0] : null;
  };

  // Try primary first, then secondary if provided
  const primaryResult = await tryWithKey(primaryKey);
  if (primaryResult) return primaryResult;

  if (secondaryKey) {
    const secondaryResult = await tryWithKey(secondaryKey);
    if (secondaryResult) return secondaryResult;
  }
  return null;
}

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
    const { email, firstName, lastName, role, phone, invitedBy, environment } = requestBody;

    // Determine primary and secondary Clerk keys with sensible fallback
    let primaryClerkKey: string | undefined;
    let secondaryClerkKey: string | undefined;
    if (environment === 'development' && clerkSecretKeyDev) {
      primaryClerkKey = clerkSecretKeyDev;
      secondaryClerkKey = clerkSecretKeyProd || undefined;
    } else if (environment === 'production' && clerkSecretKeyProd) {
      primaryClerkKey = clerkSecretKeyProd;
      secondaryClerkKey = clerkSecretKeyDev || undefined;
    } else {
      primaryClerkKey = clerkSecretKeyDev || clerkSecretKeyProd;
      secondaryClerkKey = primaryClerkKey === clerkSecretKeyDev ? clerkSecretKeyProd : clerkSecretKeyDev;
    }

    if (!primaryClerkKey) {
      console.error('No Clerk secret key available. Env:', environment, 'Have dev?', !!clerkSecretKeyDev, 'Have prod?', !!clerkSecretKeyProd);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Clerk integration not configured properly'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Invite-user: Requested environment=${environment || 'unspecified'}. Keys present -> dev:${!!clerkSecretKeyDev}, prod:${!!clerkSecretKeyProd}. Using primary=${primaryClerkKey === clerkSecretKeyDev ? 'dev' : 'prod'}`);

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

    // Step 1: Generate secure invitation token
    const invitationToken = crypto.randomUUID();
    console.log('Generated invitation token');

    // Step 2: Create Clerk user account (with key fallback)
    console.log('Creating Clerk user account...');
    
    const createWithKey = async (apiKey: string) => {
      const resp = await clerkFetch('/v1/users', apiKey, {
        method: 'POST',
        body: JSON.stringify({
          email_address: [email],
          first_name: firstName,
          last_name: lastName,
          public_metadata: {
            role: role,
            invited_by: invitedBy,
            invitation_token: invitationToken
          },
          skip_password_requirement: true,
          skip_password_checks: true,
          created_at: new Date().toISOString()
        }),
      });
      return resp;
    };

    let clerkResponse = await createWithKey(primaryClerkKey!);
    let clerkUserId: string | null = null;

    if (!clerkResponse.ok) {
      const firstError = await clerkResponse.text();
      console.error('Clerk API error (primary key):', firstError);

      const status = (clerkResponse as any).status as number;
      const looksLikeKeyInvalid = status === 401 || status === 403 || firstError.includes('clerk_key_invalid') || firstError.toLowerCase().includes('secret key');
      const looksLikeAlreadyExists = status === 422 || firstError.toLowerCase().includes('already exists') || firstError.toLowerCase().includes('form_identifier_exists');

      // If key invalid, try secondary for create
      if (secondaryClerkKey && looksLikeKeyInvalid) {
        console.log('Retrying Clerk user creation with secondary key...');
        clerkResponse = await createWithKey(secondaryClerkKey);
      }

      // If still not ok, handle existing user case by lookup
      if (!clerkResponse.ok) {
        const clerkError = await clerkResponse.text();
        console.error('Clerk API error (final):', clerkError);

        const finalStatus = (clerkResponse as any).status as number;
        const finalAlreadyExists = finalStatus === 422 || clerkError.toLowerCase().includes('already exists') || clerkError.toLowerCase().includes('form_identifier_exists');

        if (finalAlreadyExists) {
          console.log('Clerk indicates user already exists. Attempting lookup by email...');
          const existing = await findClerkUserByEmail(email, primaryClerkKey!, secondaryClerkKey);
          if (!existing) {
            return new Response(
              JSON.stringify({
                success: false,
                error: 'User already exists in Clerk, but could not be retrieved by email'
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          clerkUserId = existing.id;
          console.log(`Found existing Clerk user: ${clerkUserId}. Proceeding with Supabase records.`);
        } else {
          // Non-duplicate failure
          throw new Error(`Clerk API error: ${clerkError}`);
        }
      }
    }

    // If we created the Clerk user successfully, read id
    if (!clerkUserId && clerkResponse.ok) {
      const clerkUser = await clerkResponse.json();
      clerkUserId = clerkUser.id;
      console.log(`Created Clerk user with ID: ${clerkUserId}`);
    }

    if (!clerkUserId) {
      throw new Error('Unable to determine Clerk user id.');
    }

    // Step 3: Create user invitation record in Supabase
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
        invitation_token: invitationToken,
        clerk_user_id: clerkUserId,
        sent_at: new Date().toISOString(),
        invitation_type: 'user_creation',
        metadata: {
          created_via: 'admin_invite',
          clerk_user_created: true
        }
      })
      .select()
      .single();

    if (invitationError) {
      console.error('Supabase invitation error:', invitationError);
      throw new Error(`Failed to create invitation record: ${invitationError.message}`);
    }

    console.log('Created invitation record:', invitation.id);

    // Step 4: Upsert Supabase profile (idempotent)
    console.log('Upserting Supabase profile...');
    const { error: profileUpsertError } = await supabase
      .from('profiles')
      .upsert({
        clerk_user_id: clerkUserId,
        email,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'clerk_user_id' });

    if (profileUpsertError) {
      console.error('Profile upsert error:', profileUpsertError);
      // Not fatal; continue
    }

    // Step 5: Create user role (ignore conflict)
    console.log('Creating user role...');
    const { error: roleInsertError } = await supabase
      .from('user_roles')
      .insert({
        user_id: clerkUserId,
        role: role as any // Cast to enum
      });

    if (roleInsertError) {
      // If duplicate or similar, keep going
      console.warn('Role creation warning:', roleInsertError);
    }

    // Step 6: Send welcome email
    console.log('Sending welcome email...');
    const loginUrl = `${Deno.env.get('SUPABASE_URL')?.replace('supabase.co', 'lovable.app') || 'https://your-app.lovable.app'}/auth`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #1a73e8; margin-bottom: 10px;">Welcome to PortaPro!</h1>
          <p style="color: #666; font-size: 16px;">You've been invited to join the team</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h2 style="color: #333; margin-bottom: 15px;">Account Details</h2>
          <p style="margin: 8px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0;"><strong>Role:</strong> ${role.charAt(0).toUpperCase() + role.slice(1)}</p>
        </div>
        
        <div style="background: #e8f0fe; padding: 25px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #1a73e8; margin-bottom: 15px;">Getting Started</h3>
          <ol style="color: #333; padding-left: 20px;">
            <li style="margin-bottom: 10px;">Click the login button below to access your account</li>
            <li style="margin-bottom: 10px;">You'll be prompted to set up your password on first login</li>
            <li style="margin-bottom: 10px;">Complete your profile information</li>
            <li style="margin-bottom: 10px;">Start using PortaPro to manage your work</li>
          </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="background: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Login to PortaPro
          </a>
        </div>
        
        <div style="background: #fef7e0; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h4 style="color: #f57c00; margin-bottom: 10px;">📱 Mobile Access</h4>
          <p style="color: #666; margin: 0;">PortaPro is optimized for mobile use. Bookmark the login page on your phone for easy access in the field.</p>
        </div>
        
        <div style="border-top: 1px solid #e0e0e0; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
          <p>If you have any questions, please contact your administrator.</p>
          <p style="margin-top: 15px;">This invitation was sent by ${invitedBy}</p>
        </div>
      </div>
    `;

    const emailResponse = await resend.emails.send({
      from: 'welcome@portaprosoftware.com',
      to: [email],
      subject: 'Welcome to PortaPro - Your Account is Ready!',
      html: emailContent,
    });

    if ((emailResponse as any).error) {
      console.error('Email sending failed:', (emailResponse as any).error);
      // Update invitation with error but don't fail the entire process
      await supabase
        .from('user_invitations')
        .update({ 
          error_message: `Email failed: ${(emailResponse as any).error.message}`,
          metadata: { 
            ...(invitation?.metadata || {}), 
            email_error: (emailResponse as any).error 
          }
        })
        .eq('id', invitation.id);
    } else {
      console.log('Welcome email sent successfully:', (emailResponse as any).data?.id);
    }

    // Step 7: Log the invitation activity
    await supabase
      .from('driver_activity_log')
      .insert({
        driver_id: clerkUserId,
        action_type: 'user_invited',
        performed_by: invitedBy,
        action_details: {
          invitation_id: invitation.id,
          email,
          role,
          invited_at: new Date().toISOString()
        }
      });

    console.log('User invitation process completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'User invited successfully',
        data: {
          clerkUserId,
          invitationId: invitation.id,
          email,
          role,
          emailSent: !(emailResponse as any).error
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
