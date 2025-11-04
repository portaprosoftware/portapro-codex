import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MaintenanceAlertRequest {
  vehicleId: string;
  userIds: string[]; // Fleet managers + assigned driver
  vehicleName: string;
  maintenanceType: string;
  priority: 'routine' | 'urgent' | 'critical';
  dueDate?: string;
  currentMileage?: number;
  dueMileage?: number;
  lastMaintenanceDate?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      vehicleId,
      userIds,
      vehicleName,
      maintenanceType,
      priority,
      dueDate,
      currentMileage,
      dueMileage,
      lastMaintenanceDate
    }: MaintenanceAlertRequest = await req.json();

    console.log('Processing maintenance alert notification:', { vehicleId, vehicleName, priority, userIds });

    if (!vehicleId || !userIds || userIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: vehicleId and userIds' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const priorityColors: Record<string, string> = {
      routine: '#667eea',
      urgent: '#f59e0b',
      critical: '#ef4444'
    };

    const priorityLabels: Record<string, string> = {
      routine: 'Routine Maintenance',
      urgent: 'Urgent Maintenance',
      critical: 'Critical Maintenance'
    };

    const emailSubject = `${priorityLabels[priority]} Alert: ${vehicleName}`;

    // Generate email content
    const emailContent = `
      <h2 style="color: ${priorityColors[priority]}">${priorityLabels[priority]} Alert</h2>
      <p>Vehicle maintenance is ${priority === 'critical' ? 'critically overdue' : priority === 'urgent' ? 'urgently needed' : 'due soon'}:</p>
      
      <div class="info-box" style="border-left-color: ${priorityColors[priority]}">
        <p><strong>Vehicle:</strong> ${vehicleName}</p>
        <p><strong>Maintenance Type:</strong> ${maintenanceType}</p>
        <p><strong>Priority:</strong> <span style="color: ${priorityColors[priority]}; font-weight: bold;">${priority.toUpperCase()}</span></p>
        ${dueDate ? `<p><strong>Due Date:</strong> ${dueDate}</p>` : ''}
        ${currentMileage && dueMileage ? `
          <p><strong>Mileage:</strong> ${currentMileage.toLocaleString()} / ${dueMileage.toLocaleString()} miles</p>
          <div style="background-color: #f3f4f6; border-radius: 4px; height: 8px; margin-top: 8px;">
            <div style="background: ${priorityColors[priority]}; height: 8px; border-radius: 4px; width: ${Math.min(100, (currentMileage / dueMileage) * 100)}%"></div>
          </div>
        ` : ''}
        ${lastMaintenanceDate ? `<p><strong>Last Service:</strong> ${lastMaintenanceDate}</p>` : ''}
      </div>
      
      ${priority === 'critical' ? `
        <div style="background-color: #fee; border-left: 4px solid #ef4444; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #991b1b;"><strong>⚠️ Critical Action Required:</strong> This vehicle requires immediate maintenance attention. Do not operate until serviced.</p>
        </div>
      ` : priority === 'urgent' ? `
        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
          <p style="margin: 0; color: #92400e;"><strong>⚠️ Urgent:</strong> Schedule maintenance within the next 48 hours to prevent service disruption.</p>
        </div>
      ` : ''}
      
      <p style="text-align: center;">
        <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/fleet/vehicles/${vehicleId}" class="button" style="background: ${priorityColors[priority]}">Schedule Maintenance</a>
      </p>
    `;

    const results = {
      sent: 0,
      failed: 0,
      emails: [] as any[],
      pushes: [] as any[]
    };

    // Send notifications to all specified users
    for (const userId of userIds) {
      // Send email notification
      const emailResult = await supabase.functions.invoke('send-notification-email', {
        body: {
          userId: userId,
          notificationType: 'maintenance_alerts',
          subject: emailSubject,
          htmlContent: emailContent,
          data: {
            vehicleId,
            vehicleName,
            maintenanceType,
            priority,
            dueDate,
            currentMileage,
            dueMileage,
          }
        }
      });

      if (emailResult.error) {
        console.error(`Error sending email to user ${userId}:`, emailResult.error);
        results.failed++;
      } else {
        console.log(`Email notification sent to user ${userId}:`, emailResult.data);
        results.sent++;
        results.emails.push(emailResult.data);
      }

      // Send push notification
      const pushResult = await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: userId,
          title: `${priorityLabels[priority]}: ${vehicleName}`,
          body: `${maintenanceType} - ${dueDate ? `Due ${dueDate}` : dueMileage ? `Due at ${dueMileage.toLocaleString()} miles` : 'Schedule soon'}`,
          notificationType: 'maintenance_alerts',
          url: `/fleet/vehicles/${vehicleId}`,
          data: {
            vehicleId,
            vehicleName,
            maintenanceType,
            priority,
          }
        }
      });

      if (pushResult.error) {
        console.error(`Error sending push to user ${userId}:`, pushResult.error);
      } else {
        console.log(`Push notification sent to user ${userId}:`, pushResult.data);
        results.pushes.push(pushResult.data);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Maintenance alert notifications sent to ${results.sent} users`,
        results
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trigger-maintenance-alert function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
