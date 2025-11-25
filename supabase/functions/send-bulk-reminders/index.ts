import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkReminderRequest {
  driverIds: string[];
  message: string;
  type: 'manual' | 'automated';
  reminderType?: 'license' | 'medical' | 'training' | 'general';
  organizationId: string; // Required for multi-tenant isolation
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { driverIds, message, type, reminderType = 'general', organizationId }: BulkReminderRequest = await req.json();

    // Validate organization_id is provided
    if (!organizationId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'organizationId is required for multi-tenant data isolation'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    console.log(`Processing bulk reminder for ${driverIds.length} drivers in org: ${organizationId}`);

    // Fetch driver information - filter by organization_id for security
    const { data: drivers, error: driversError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone,
        organization_id
      `)
      .in('id', driverIds)
      .eq('organization_id', organizationId); // Critical: ensure drivers belong to this org

    if (driversError) {
      throw new Error(`Failed to fetch drivers: ${driversError.message}`);
    }

    if (!drivers || drivers.length === 0) {
      throw new Error('No drivers found with provided IDs');
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    // Send reminders to each driver
    for (const driver of drivers) {
      try {
        if (!driver.email) {
          results.failed++;
          results.errors.push(`No email address for ${driver.first_name} ${driver.last_name}`);
          continue;
        }

        // Customize message with driver info
        const personalizedMessage = message.replace(
          /\{driver_name\}/g, 
          `${driver.first_name} ${driver.last_name}`
        );

        // Send email reminder
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'PortaPro <noreply@portapro.com>',
            to: [driver.email],
            subject: `Important Reminder - ${reminderType === 'general' ? 'Team Update' : `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Reminder`}`,
            html: `
...
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorData = await emailResponse.json();
          throw new Error(`Resend API error: ${errorData.message || 'Unknown error'}`);
        }

        const emailResult = await emailResponse.json();

        // Log the communication with organization_id
        await supabase.from('customer_communications').insert({
          customer_id: driver.id,
          type: 'email',
          subject: `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Reminder`,
          content: personalizedMessage,
          email_address: driver.email,
          status: 'sent',
          organization_id: organizationId
        });

        // Log driver activity with organization_id
        await supabase.from('driver_activity_log').insert({
          driver_id: driver.id,
          action_type: 'reminder_sent',
          action_details: {
            reminder_type: reminderType,
            message_type: type,
            sent_via: 'email'
          },
          organization_id: organizationId
        });

        results.successful++;
        console.log(`Reminder sent successfully to ${driver.email}`);

      } catch (error) {
        console.error(`Failed to send reminder to ${driver.email}:`, error);
        results.failed++;
        results.errors.push(`Failed to send to ${driver.email}: ${error.message}`);
      }
    }

    console.log(`Bulk reminder complete: ${results.successful} successful, ${results.failed} failed`);

    return new Response(JSON.stringify({
      success: true,
      results,
      message: `Sent ${results.successful} reminders successfully${results.failed > 0 ? ` (${results.failed} failed)` : ''}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Bulk reminder error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      details: 'Failed to send bulk reminders'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
};

serve(handler);