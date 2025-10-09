import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Alert {
  id: string;
  tank_id: string;
  severity: string;
  message: string;
  alert_type: string;
  created_at: string;
}

interface Tank {
  tank_number: string;
  tank_name: string;
  current_level_gallons: number;
  capacity_gallons: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting fuel notifications job...');
    
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    // Get fuel management settings
    const { data: settings, error: settingsError } = await supabase
      .from('fuel_management_settings')
      .select('*')
      .limit(1)
      .single();

    if (settingsError) {
      console.error('Error fetching settings:', settingsError);
      throw settingsError;
    }

    console.log('Settings:', settings);

    // Check if notifications are enabled
    if (!settings.notifications_enabled || !settings.email_notifications) {
      console.log('Email notifications disabled');
      return new Response(
        JSON.stringify({ message: 'Notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!settings.notification_email) {
      console.log('No notification email configured');
      return new Response(
        JSON.stringify({ message: 'No email configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch unacknowledged alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('fuel_tank_inventory_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('severity', { ascending: false })
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
      throw alertsError;
    }

    console.log(`Found ${alerts?.length || 0} unacknowledged alerts`);

    if (!alerts || alerts.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No alerts to send' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch tank details for the alerts
    const tankIds = [...new Set(alerts.map(a => a.tank_id))];
    const { data: tanks, error: tanksError } = await supabase
      .from('fuel_tanks')
      .select('id, tank_number, tank_name, current_level_gallons, capacity_gallons')
      .in('id', tankIds);

    if (tanksError) {
      console.error('Error fetching tanks:', tanksError);
      throw tanksError;
    }

    // Group alerts by severity
    const criticalAlerts = alerts.filter(a => a.severity === 'critical');
    const warningAlerts = alerts.filter(a => a.severity === 'warning');

    // Build email HTML
    const emailHtml = buildEmailHtml(
      criticalAlerts as Alert[],
      warningAlerts as Alert[],
      tanks as Tank[]
    );

    // Send email
    console.log(`Sending email to: ${settings.notification_email}`);
    
    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: 'PortaPro Fuel Management <fuel@notifications.portapro.app>',
      to: [settings.notification_email],
      subject: `Fuel Management Alert: ${criticalAlerts.length} Critical, ${warningAlerts.length} Warnings`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('Error sending email:', emailError);
      throw emailError;
    }

    console.log('Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notifications sent',
        emailId: emailResult?.id,
        alertCount: alerts.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in send-fuel-notifications:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildEmailHtml(
  criticalAlerts: Alert[],
  warningAlerts: Alert[],
  tanks: Tank[]
): string {
  const tankMap = new Map(tanks.map(t => [t.id, t]));
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
        .alert-section { margin: 20px 0; }
        .alert-item { padding: 15px; margin: 10px 0; border-left: 4px solid; border-radius: 4px; }
        .critical { background: #fee; border-color: #dc2626; }
        .warning { background: #fef3cd; border-color: #f59e0b; }
        .tank-info { font-size: 0.9em; color: #666; margin-top: 8px; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.85em; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0;">🚨 Fuel Management Alerts</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Your daily fuel tank status report</p>
        </div>
  `;

  if (criticalAlerts.length > 0) {
    html += `
      <div class="alert-section">
        <h2 style="color: #dc2626;">⚠️ Critical Alerts (${criticalAlerts.length})</h2>
    `;
    
    criticalAlerts.forEach(alert => {
      const tank = tankMap.get(alert.tank_id);
      const levelPercent = tank 
        ? ((tank.current_level_gallons / tank.capacity_gallons) * 100).toFixed(1)
        : 'N/A';
      
      html += `
        <div class="alert-item critical">
          <strong>${alert.message}</strong>
          <div class="tank-info">
            ${tank ? `
              Tank: ${tank.tank_name || tank.tank_number} | 
              Level: ${tank.current_level_gallons} gal (${levelPercent}%) | 
              Capacity: ${tank.capacity_gallons} gal
            ` : 'Tank details unavailable'}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  if (warningAlerts.length > 0) {
    html += `
      <div class="alert-section">
        <h2 style="color: #f59e0b;">⚡ Warning Alerts (${warningAlerts.length})</h2>
    `;
    
    warningAlerts.forEach(alert => {
      const tank = tankMap.get(alert.tank_id);
      const levelPercent = tank 
        ? ((tank.current_level_gallons / tank.capacity_gallons) * 100).toFixed(1)
        : 'N/A';
      
      html += `
        <div class="alert-item warning">
          <strong>${alert.message}</strong>
          <div class="tank-info">
            ${tank ? `
              Tank: ${tank.tank_name || tank.tank_number} | 
              Level: ${tank.current_level_gallons} gal (${levelPercent}%) | 
              Capacity: ${tank.capacity_gallons} gal
            ` : 'Tank details unavailable'}
          </div>
        </div>
      `;
    });
    
    html += `</div>`;
  }

  html += `
        <div class="footer">
          <p>This is an automated notification from PortaPro Fuel Management System.</p>
          <p>Please log in to your dashboard to acknowledge these alerts and take appropriate action.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}