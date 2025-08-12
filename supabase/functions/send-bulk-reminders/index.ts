import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkReminderRequest {
  driverIds: string[];
  message: string;
  type: 'manual' | 'automated';
  reminderType?: 'license' | 'medical' | 'training' | 'general';
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
    const { driverIds, message, type, reminderType = 'general' }: BulkReminderRequest = await req.json();

    console.log(`Processing bulk reminder for ${driverIds.length} drivers`);

    // Fetch driver information
    const { data: drivers, error: driversError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        first_name,
        last_name,
        phone
      `)
      .in('id', driverIds);

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
        const emailResponse = await resend.emails.send({
          from: 'PortaPro <noreply@portapro.com>',
          to: [driver.email],
          subject: `Important Reminder - ${reminderType === 'general' ? 'Team Update' : `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Reminder`}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <header style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 20px; text-align: center;">
                <h1 style="color: white; margin: 0;">PortaPro</h1>
              </header>
              
              <main style="padding: 30px; background: #f8fafc;">
                <h2 style="color: #1e293b; margin-bottom: 20px;">
                  Hello ${driver.first_name},
                </h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #3b82f6; margin: 20px 0;">
                  ${personalizedMessage.split('\n').map(line => `<p style="margin: 10px 0; color: #334155;">${line}</p>`).join('')}
                </div>
                
                ${reminderType !== 'general' ? `
                <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; color: #92400e; font-weight: 500;">
                    📋 This is a ${reminderType} reminder. Please take action if required.
                  </p>
                </div>
                ` : ''}
                
                <p style="color: #64748b; margin-top: 30px;">
                  If you have any questions, please contact your supervisor or the team management.
                </p>
              </main>
              
              <footer style="background: #e2e8f0; padding: 20px; text-align: center; color: #64748b; font-size: 14px;">
                <p style="margin: 0;">This is an automated message from PortaPro Team Management System</p>
              </footer>
            </div>
          `,
        });

        if (emailResponse.error) {
          throw new Error(`Email failed: ${emailResponse.error.message}`);
        }

        // Log the communication
        await supabase.from('customer_communications').insert({
          customer_id: driver.id,
          type: 'email',
          subject: `${reminderType.charAt(0).toUpperCase() + reminderType.slice(1)} Reminder`,
          content: personalizedMessage,
          email_address: driver.email,
          status: 'sent'
        });

        // Log driver activity
        await supabase.from('driver_activity_log').insert({
          driver_id: driver.id,
          action_type: 'reminder_sent',
          action_details: {
            reminder_type: reminderType,
            message_type: type,
            sent_via: 'email'
          }
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