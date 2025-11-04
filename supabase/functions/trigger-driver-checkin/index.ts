import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DriverCheckinRequest {
  driverId: string;
  driverName: string;
  checkinType: 'start_shift' | 'end_shift' | 'break_start' | 'break_end' | 'job_arrival' | 'job_departure';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  jobNumber?: string;
  vehicleId?: string;
  notes?: string;
  notifyUserIds: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: DriverCheckinRequest = await req.json();
    console.log('[Driver Checkin] Processing notification:', payload);

    // Construct content based on checkin type
    let subject = '';
    let emailContent = '';
    let iconColor = '#0284c7';

    const formattedTime = new Date(payload.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    switch (payload.checkinType) {
      case 'start_shift':
        subject = `✅ Shift Started: ${payload.driverName}`;
        iconColor = '#059669';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Shift Started</h2>
          <p><strong>${payload.driverName}</strong> has started their shift.</p>
          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
            ${payload.location?.address ? `<p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${payload.location.address}</p>` : ''}
            ${payload.vehicleId ? `<p style="margin: 8px 0 0 0;"><strong>Vehicle:</strong> Assigned</p>` : ''}
          </div>
        `;
        break;
      case 'end_shift':
        subject = `🏁 Shift Ended: ${payload.driverName}`;
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Shift Ended</h2>
          <p><strong>${payload.driverName}</strong> has completed their shift.</p>
          <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
            ${payload.location?.address ? `<p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${payload.location.address}</p>` : ''}
            ${payload.notes ? `<p style="margin: 8px 0 0 0;"><strong>Notes:</strong> ${payload.notes}</p>` : ''}
          </div>
        `;
        break;
      case 'break_start':
        subject = `☕ Break Started: ${payload.driverName}`;
        iconColor = '#f59e0b';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Break Started</h2>
          <p><strong>${payload.driverName}</strong> is on break.</p>
          <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
          </div>
        `;
        break;
      case 'break_end':
        subject = `✅ Break Ended: ${payload.driverName}`;
        iconColor = '#059669';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Break Ended</h2>
          <p><strong>${payload.driverName}</strong> has returned from break.</p>
          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
          </div>
        `;
        break;
      case 'job_arrival':
        subject = `📍 Job Arrival: ${payload.driverName}`;
        iconColor = '#8b5cf6';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Arrived at Job Site</h2>
          <p><strong>${payload.driverName}</strong> has arrived at the job location.</p>
          <div style="margin: 20px 0; padding: 20px; background: #faf5ff; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            ${payload.jobNumber ? `<p style="margin: 8px 0 0 0;"><strong>Job:</strong> ${payload.jobNumber}</p>` : ''}
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
            ${payload.location?.address ? `<p style="margin: 8px 0 0 0;"><strong>Location:</strong> ${payload.location.address}</p>` : ''}
          </div>
        `;
        break;
      case 'job_departure':
        subject = `✅ Job Complete: ${payload.driverName}`;
        iconColor = '#059669';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Departed Job Site</h2>
          <p><strong>${payload.driverName}</strong> has completed the job and departed.</p>
          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Driver:</strong> ${payload.driverName}</p>
            ${payload.jobNumber ? `<p style="margin: 8px 0 0 0;"><strong>Job:</strong> ${payload.jobNumber}</p>` : ''}
            <p style="margin: 8px 0 0 0;"><strong>Time:</strong> ${formattedTime}</p>
            ${payload.notes ? `<p style="margin: 8px 0 0 0;"><strong>Notes:</strong> ${payload.notes}</p>` : ''}
          </div>
        `;
        break;
    }

    emailContent += `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          View all driver activity in the dispatch dashboard.
        </p>
      </div>
    `;

    // Send notifications to dispatch and managers
    for (const userId of payload.notifyUserIds) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId,
          subject,
          content: emailContent,
          priority: 'normal'
        }
      });

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: subject,
          body: `${formattedTime}${payload.jobNumber ? ` - Job ${payload.jobNumber}` : ''}`,
          data: {
            type: 'driver_checkin',
            driverId: payload.driverId,
            checkinType: payload.checkinType,
            jobNumber: payload.jobNumber
          }
        }
      });
    }

    console.log('[Driver Checkin] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Driver Checkin] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
