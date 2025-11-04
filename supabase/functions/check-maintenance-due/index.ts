import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[Maintenance Alerts] Starting scheduled check...');

    // Get current date and 7 days from now
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Query maintenance records that are:
    // 1. Scheduled within the next 7 days
    // 2. Status is 'scheduled'
    const { data: maintenanceRecords, error: fetchError } = await supabase
      .from('maintenance_records')
      .select('id, vehicle_id, maintenance_type, scheduled_date, description, vehicles(id, license_plate, make, model)')
      .eq('status', 'scheduled')
      .lte('scheduled_date', sevenDaysFromNow.toISOString().split('T')[0])
      .gte('scheduled_date', today.toISOString().split('T')[0])
      .limit(50);

    if (fetchError) {
      console.error('[Maintenance Alerts] Error fetching records:', fetchError);
      throw fetchError;
    }

    console.log(`[Maintenance Alerts] Found ${maintenanceRecords?.length || 0} maintenance records to process`);

    let successCount = 0;
    let errorCount = 0;

    // Send alerts for each maintenance record
    for (const record of maintenanceRecords || []) {
      try {
        const vehicle = record.vehicles;
        const vehicleName = vehicle 
          ? `${vehicle.make} ${vehicle.model} (${vehicle.license_plate})`
          : 'Unknown Vehicle';

        const daysUntilDue = Math.ceil(
          (new Date(record.scheduled_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Determine priority based on days until due
        let priority: 'low' | 'normal' | 'high' = 'normal';
        if (daysUntilDue <= 1) priority = 'high';
        else if (daysUntilDue <= 3) priority = 'normal';
        else priority = 'low';

        await supabase.functions.invoke('trigger-maintenance-alert', {
          body: {
            maintenanceId: record.id,
            vehicleId: record.vehicle_id,
            vehicleName,
            alertType: record.maintenance_type,
            dueDate: record.scheduled_date,
            description: record.description,
            priority,
            notifyUserIds: [], // Will be fetched in trigger function based on roles
          }
        });

        successCount++;
        console.log(`[Maintenance Alerts] Sent alert for ${vehicleName} - ${record.maintenance_type}`);
      } catch (error) {
        errorCount++;
        console.error(`[Maintenance Alerts] Error sending alert for record ${record.id}:`, error);
      }
    }

    console.log(`[Maintenance Alerts] Completed: ${successCount} sent, ${errorCount} errors`);

    return new Response(JSON.stringify({ 
      success: true, 
      processed: maintenanceRecords?.length || 0,
      sent: successCount,
      errors: errorCount 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Maintenance Alerts] Fatal error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

serve(handler);
