import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VehicleStatusChangeRequest {
  vehicleId: string;
  vehicleName: string;
  oldStatus: string;
  newStatus: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  assignedDriverId?: string;
  reason?: string;
  estimatedReturnDate?: string;
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

    const payload: VehicleStatusChangeRequest = await req.json();
    console.log('[Vehicle Status Change] Processing notification:', payload);

    // Construct content based on new status
    let subject = '';
    let emailContent = '';
    let iconColor = '#0284c7';
    let priority: 'low' | 'normal' | 'high' = 'normal';

    switch (payload.newStatus) {
      case 'available':
        subject = `✅ Vehicle Available: ${payload.vehicleName}`;
        iconColor = '#059669';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Vehicle Now Available</h2>
          <p><strong>${payload.vehicleName}</strong> is now available for use.</p>
          <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Vehicle:</strong> ${payload.vehicleName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Previous Status:</strong> ${payload.oldStatus}</p>
            <p style="margin: 8px 0 0 0;"><strong>New Status:</strong> Available</p>
          </div>
        `;
        break;
      case 'in_use':
        subject = `🚛 Vehicle In Use: ${payload.vehicleName}`;
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Vehicle In Use</h2>
          <p><strong>${payload.vehicleName}</strong> has been assigned and is now in use.</p>
          <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Vehicle:</strong> ${payload.vehicleName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Status:</strong> In Use</p>
            ${payload.assignedDriverId ? `<p style="margin: 8px 0 0 0;"><strong>Assigned To:</strong> Driver</p>` : ''}
          </div>
        `;
        break;
      case 'maintenance':
        subject = `🔧 Vehicle Maintenance: ${payload.vehicleName}`;
        iconColor = '#f59e0b';
        priority = 'high';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Vehicle In Maintenance</h2>
          <p><strong>${payload.vehicleName}</strong> is now in maintenance and unavailable.</p>
          <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Vehicle:</strong> ${payload.vehicleName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Maintenance</p>
            ${payload.reason ? `<p style="margin: 8px 0 0 0;"><strong>Reason:</strong> ${payload.reason}</p>` : ''}
            ${payload.estimatedReturnDate ? `<p style="margin: 8px 0 0 0;"><strong>Est. Return:</strong> ${new Date(payload.estimatedReturnDate).toLocaleDateString()}</p>` : ''}
          </div>
        `;
        break;
      case 'out_of_service':
        subject = `⚠️ Vehicle Out of Service: ${payload.vehicleName}`;
        iconColor = '#dc2626';
        priority = 'high';
        emailContent = `
          <h2 style="color: ${iconColor}; margin-bottom: 16px;">Vehicle Out of Service</h2>
          <p><strong>${payload.vehicleName}</strong> is now out of service.</p>
          <div style="margin: 20px 0; padding: 20px; background: #fef2f2; border-left: 4px solid ${iconColor}; border-radius: 8px;">
            <p style="margin: 0;"><strong>Vehicle:</strong> ${payload.vehicleName}</p>
            <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Out of Service</p>
            ${payload.reason ? `<p style="margin: 8px 0 0 0;"><strong>Reason:</strong> ${payload.reason}</p>` : ''}
            ${payload.estimatedReturnDate ? `<p style="margin: 8px 0 0 0;"><strong>Est. Return:</strong> ${new Date(payload.estimatedReturnDate).toLocaleDateString()}</p>` : ''}
          </div>
          <div style="margin-top: 16px; padding: 16px; background: #fee2e2; border-radius: 8px;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">⚠️ This vehicle is unavailable for assignments</p>
          </div>
        `;
        break;
    }

    emailContent += `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">
          Check the fleet management dashboard for full vehicle status.
        </p>
      </div>
    `;

    // Send notifications to all specified users
    for (const userId of payload.notifyUserIds) {
      await supabase.functions.invoke('send-notification-email', {
        body: {
          userId,
          subject,
          content: emailContent,
          priority
        }
      });

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId,
          title: subject,
          body: `Status: ${payload.newStatus}${payload.reason ? ` - ${payload.reason}` : ''}`,
          data: {
            type: 'vehicle_status_change',
            vehicleId: payload.vehicleId,
            newStatus: payload.newStatus
          }
        }
      });
    }

    console.log('[Vehicle Status Change] Notifications sent successfully');
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Vehicle Status Change] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
