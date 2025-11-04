import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NewTeamMemberRequest {
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  role: string;
  department?: string;
  invitedBy?: string;
  startDate?: string;
  notifyTeam?: boolean;
  notifyUserIds?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: NewTeamMemberRequest = await req.json();
    console.log('[New Team Member] Processing notification:', payload);

    // Welcome email to new team member
    const welcomeSubject = `👋 Welcome to the Team!`;
    const welcomeEmailContent = `
      <h2 style="color: #059669; margin-bottom: 16px;">Welcome Aboard, ${payload.newUserName}!</h2>
      <p>We're excited to have you join our team.</p>
      <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #059669; border-radius: 8px;">
        <p style="margin: 0;"><strong>Your Role:</strong> ${payload.role}</p>
        ${payload.department ? `<p style="margin: 8px 0 0 0;"><strong>Department:</strong> ${payload.department}</p>` : ''}
        ${payload.startDate ? `<p style="margin: 8px 0 0 0;"><strong>Start Date:</strong> ${new Date(payload.startDate).toLocaleDateString()}</p>` : ''}
      </div>
      <div style="margin-top: 24px;">
        <h3 style="color: #374151; margin-bottom: 12px;">Getting Started</h3>
        <ul style="color: #6b7280; line-height: 1.8;">
          <li>Complete your profile in the app</li>
          <li>Review your assigned tasks and schedule</li>
          <li>Familiarize yourself with the team dashboard</li>
          <li>Reach out if you have any questions</li>
        </ul>
      </div>
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          We're here to help you succeed. Welcome to the team! 🎉
        </p>
      </div>
    `;

    // Send welcome email to new team member
    await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: payload.newUserId,
        subject: welcomeSubject,
        content: welcomeEmailContent,
        priority: 'high',
        recipientEmail: payload.newUserEmail
      }
    });

    // Notify existing team members
    if (payload.notifyTeam && payload.notifyUserIds && payload.notifyUserIds.length > 0) {
      const teamSubject = `👥 New Team Member: ${payload.newUserName}`;
      const teamEmailContent = `
        <h2 style="color: #0284c7; margin-bottom: 16px;">New Team Member</h2>
        <p>Please welcome <strong>${payload.newUserName}</strong> to the team!</p>
        <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #0284c7; border-radius: 8px;">
          <p style="margin: 0;"><strong>Name:</strong> ${payload.newUserName}</p>
          <p style="margin: 8px 0 0 0;"><strong>Role:</strong> ${payload.role}</p>
          ${payload.department ? `<p style="margin: 8px 0 0 0;"><strong>Department:</strong> ${payload.department}</p>` : ''}
          ${payload.startDate ? `<p style="margin: 8px 0 0 0;"><strong>Start Date:</strong> ${new Date(payload.startDate).toLocaleDateString()}</p>` : ''}
        </div>
        <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 14px;">
            Help them get oriented and feel welcome!
          </p>
        </div>
      `;

      for (const userId of payload.notifyUserIds) {
        await supabase.functions.invoke('send-notification-email', {
          body: {
            userId,
            subject: teamSubject,
            content: teamEmailContent,
            priority: 'normal'
          }
        });

        await supabase.functions.invoke('send-push-notification', {
          body: {
            userId,
            title: teamSubject,
            body: `${payload.role}${payload.department ? ` - ${payload.department}` : ''}`,
            data: {
              type: 'new_team_member',
              newUserId: payload.newUserId,
              role: payload.role
            }
          }
        });
      }
    }

    console.log('[New Team Member] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[New Team Member] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
