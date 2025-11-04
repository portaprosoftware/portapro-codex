import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RouteScheduleChangeRequest {
  driverId: string;
  changeType: 'route_change' | 'schedule_change' | 'shift_reassignment';
  oldValue?: string;
  newValue?: string;
  effectiveDate: string;
  reason?: string;
  jobNumbers?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: RouteScheduleChangeRequest = await req.json();
    console.log('[Route Schedule Change] Processing notification:', payload);

    // Construct email content based on change type
    let subject = '';
    let emailContent = '';

    switch (payload.changeType) {
      case 'route_change':
        subject = '🗺️ Route Change Notification';
        emailContent = `
          <h2 style="color: #0284c7; margin-bottom: 16px;">Route Change</h2>
          <p>Your route has been updated.</p>
          ${payload.oldValue ? `<p><strong>Previous Route:</strong> ${payload.oldValue}</p>` : ''}
          ${payload.newValue ? `<p><strong>New Route:</strong> ${payload.newValue}</p>` : ''}
          <p><strong>Effective Date:</strong> ${new Date(payload.effectiveDate).toLocaleDateString()}</p>
          ${payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : ''}
          ${payload.jobNumbers && payload.jobNumbers.length > 0 ? `<p><strong>Affected Jobs:</strong> ${payload.jobNumbers.join(', ')}</p>` : ''}
        `;
        break;
      case 'schedule_change':
        subject = '📅 Schedule Update Notification';
        emailContent = `
          <h2 style="color: #0284c7; margin-bottom: 16px;">Schedule Update</h2>
          <p>Your schedule has been modified.</p>
          ${payload.oldValue ? `<p><strong>Previous Schedule:</strong> ${payload.oldValue}</p>` : ''}
          ${payload.newValue ? `<p><strong>New Schedule:</strong> ${payload.newValue}</p>` : ''}
          <p><strong>Effective Date:</strong> ${new Date(payload.effectiveDate).toLocaleDateString()}</p>
          ${payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : ''}
        `;
        break;
      case 'shift_reassignment':
        subject = '🔄 Shift Reassignment Notice';
        emailContent = `
          <h2 style="color: #f59e0b; margin-bottom: 16px;">Shift Reassignment</h2>
          <p>You have been assigned to a different shift.</p>
          ${payload.oldValue ? `<p><strong>Previous Shift:</strong> ${payload.oldValue}</p>` : ''}
          ${payload.newValue ? `<p><strong>New Shift:</strong> ${payload.newValue}</p>` : ''}
          <p><strong>Effective Date:</strong> ${new Date(payload.effectiveDate).toLocaleDateString()}</p>
          ${payload.reason ? `<p><strong>Reason:</strong> ${payload.reason}</p>` : ''}
        `;
        break;
    }

    emailContent += `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Please check your schedule in the app for full details.
        </p>
      </div>
    `;

    // Send email notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: payload.driverId,
        subject,
        content: emailContent,
        priority: 'high'
      }
    });

    // Send push notification
    await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: payload.driverId,
        title: subject,
        body: `Effective ${new Date(payload.effectiveDate).toLocaleDateString()}${payload.reason ? ` - ${payload.reason}` : ''}`,
        data: {
          type: 'route_schedule_change',
          changeType: payload.changeType,
          effectiveDate: payload.effectiveDate
        }
      }
    });

    console.log('[Route Schedule Change] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Route Schedule Change] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
