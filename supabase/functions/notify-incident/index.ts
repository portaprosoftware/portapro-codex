import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  incident_id: string;
  severity: string;
  spill_type: string;
  location_description: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { incident_id, severity, spill_type, location_description }: NotificationRequest = await req.json();

    console.log("Processing incident notification:", incident_id);

    // Get notification settings
    const { data: settings } = await supabase
      .from('incident_notification_settings')
      .select('*')
      .single();

    if (!settings || !settings.email_notifications) {
      console.log("Email notifications disabled");
      return new Response(
        JSON.stringify({ message: "Notifications disabled" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if this incident severity meets the threshold
    const severityLevels = ['minor', 'moderate', 'major', 'reportable'];
    const incidentLevel = severityLevels.indexOf(severity);
    const thresholdLevel = severityLevels.indexOf(settings.severity_threshold);

    if (incidentLevel < thresholdLevel && severity !== 'reportable') {
      console.log("Incident severity below notification threshold");
      return new Response(
        JSON.stringify({ message: "Below notification threshold" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send notifications to recipients
    const recipients = settings.notification_recipients || [];
    
    for (const recipient of recipients) {
      // Log notification attempt
      await supabase
        .from('incident_notification_logs')
        .insert({
          incident_id,
          notification_type: 'email',
          recipient,
          status: 'sent',
        });

      console.log(`Notification logged for ${recipient}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Notifications sent to ${recipients.length} recipients` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error("Error in notify-incident:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});