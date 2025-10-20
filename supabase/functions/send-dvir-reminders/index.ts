import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Checking for drivers needing DVIR reminders...');

    // Get all drivers with assigned vehicles today who haven't submitted DVIR
    const { data: assignments, error: assignmentError } = await supabase
      .from('daily_vehicle_assignments')
      .select(`
        driver_id,
        vehicle_id,
        assignment_date,
        vehicles (
          license_plate,
          vehicle_number
        )
      `)
      .eq('assignment_date', new Date().toISOString().split('T')[0])
      .is('start_mileage', null); // No DVIR submitted yet

    if (assignmentError) {
      console.error('Error fetching assignments:', assignmentError);
      throw assignmentError;
    }

    let notificationsSent = 0;
    let notificationsFailed = 0;

    for (const assignment of assignments || []) {
      try {
        // Check if driver wants DVIR reminders
        const { data: prefs } = await supabase
          .from('driver_notification_preferences')
          .select('dvir_reminder, in_app_notifications')
          .eq('driver_id', assignment.driver_id)
          .single();

        // Skip if preferences disabled (default to true if no prefs)
        if (prefs && (!prefs.dvir_reminder || !prefs.in_app_notifications)) {
          console.log(`Skipping DVIR reminder for driver ${assignment.driver_id} - preferences disabled`);
          continue;
        }

        // Check if reminder already sent today
        const { data: existing } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', assignment.driver_id)
          .eq('notification_type', 'dvir_reminder')
          .eq('related_entity_id', assignment.vehicle_id)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .single();

        if (existing) {
          console.log(`DVIR reminder already sent today for driver ${assignment.driver_id}`);
          continue;
        }

        // Create DVIR reminder notification
        const { error: notifError } = await supabase
          .from('notification_logs')
          .insert({
            user_id: assignment.driver_id,
            notification_type: 'dvir_reminder',
            title: 'DVIR Inspection Required',
            body: `Please complete DVIR inspection for vehicle ${assignment.vehicles?.license_plate || assignment.vehicles?.vehicle_number || 'assigned'}`,
            related_entity_type: 'vehicle',
            related_entity_id: assignment.vehicle_id,
            data: {
              vehicle_id: assignment.vehicle_id,
              license_plate: assignment.vehicles?.license_plate,
              vehicle_number: assignment.vehicles?.vehicle_number,
              assignment_date: assignment.assignment_date
            }
          });

        if (notifError) {
          console.error('Failed to create DVIR notification:', notifError);
          notificationsFailed++;
        } else {
          console.log(`DVIR reminder sent to driver ${assignment.driver_id} for vehicle ${assignment.vehicle_id}`);
          notificationsSent++;
        }
      } catch (err) {
        console.error('Error processing DVIR reminder for driver:', assignment.driver_id, err);
        notificationsFailed++;
      }
    }

    console.log(`DVIR reminders complete - sent: ${notificationsSent}, failed: ${notificationsFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: notificationsSent,
        failed: notificationsFailed,
        total_assignments: assignments?.length || 0,
        message: `DVIR reminders processed: ${notificationsSent} sent, ${notificationsFailed} failed`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-dvir-reminders:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
