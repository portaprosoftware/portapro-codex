import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TestNotificationRequest {
  userId: string;
  notificationType: 'job_assignment' | 'route_schedule_change' | 'maintenance_alert' | 'quote_update' | 
                     'invoice_reminder' | 'payment_confirmation' | 'low_stock_alert' | 'asset_movement' |
                     'vehicle_status_change' | 'driver_checkin' | 'new_team_member' | 'comment_mention';
  channel: 'email' | 'push' | 'both';
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const payload: TestNotificationRequest = await req.json();
    console.log('[Test Notification] Processing test:', payload);

    const results = {
      email: null as any,
      push: null as any,
    };

    // Generate test data based on notification type
    const testData = generateTestData(payload.notificationType);

    // Send email if requested
    if (payload.channel === 'email' || payload.channel === 'both') {
      try {
        const { data: emailData, error: emailError } = await supabase.functions.invoke('send-notification-email', {
          body: {
            userId: payload.userId,
            subject: testData.subject,
            content: testData.emailContent,
            priority: 'normal'
          }
        });

        results.email = emailError ? { success: false, error: emailError } : { success: true, data: emailData };
        console.log('[Test Notification] Email result:', results.email);
      } catch (error) {
        results.email = { success: false, error: error.message };
      }
    }

    // Send push if requested
    if (payload.channel === 'push' || payload.channel === 'both') {
      try {
        const { data: pushData, error: pushError } = await supabase.functions.invoke('send-push-notification', {
          body: {
            userId: payload.userId,
            title: testData.subject,
            body: testData.pushBody,
            notificationType: testData.notificationType,
            data: { test: true, type: payload.notificationType }
          }
        });

        results.push = pushError ? { success: false, error: pushError } : { success: true, data: pushData };
        console.log('[Test Notification] Push result:', results.push);
      } catch (error) {
        results.push = { success: false, error: error.message };
      }
    }

    console.log('[Test Notification] Test completed successfully');
    return new Response(JSON.stringify({ 
      success: true, 
      results,
      message: 'Test notification sent'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('[Test Notification] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    });
  }
};

function generateTestData(type: string) {
  const testDataMap = {
    job_assignment: {
      subject: '🔔 Test: New Job Assignment',
      notificationType: 'job_assignments',
      pushBody: 'You have been assigned to: Test Job #12345 - Regular Service',
      emailContent: `
        <h2 style="color: #2563eb; margin-bottom: 16px;">New Job Assignment (Test)</h2>
        <p>This is a test notification for job assignments.</p>
        <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px;">
          <p style="margin: 0;"><strong>Job Number:</strong> TEST-12345</p>
          <p style="margin: 8px 0 0 0;"><strong>Type:</strong> Regular Service</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> Test Customer Inc.</p>
          <p style="margin: 8px 0 0 0;"><strong>Address:</strong> 123 Test Street</p>
          <p style="margin: 8px 0 0 0;"><strong>Scheduled:</strong> Today at 2:00 PM</p>
        </div>
        <p style="margin-top: 16px;">View job details in your dashboard to see the full assignment.</p>
      `
    },
    route_schedule_change: {
      subject: '📍 Test: Route Schedule Changed',
      notificationType: 'route_schedule_changes',
      pushBody: 'Test route change: Schedule moved to tomorrow at 10:00 AM',
      emailContent: `
        <h2 style="color: #f59e0b; margin-bottom: 16px;">Route Schedule Change (Test)</h2>
        <p>This is a test notification for route schedule changes.</p>
        <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
          <p style="margin: 0;"><strong>Driver:</strong> Test Driver</p>
          <p style="margin: 8px 0 0 0;"><strong>Change Type:</strong> Time Change</p>
          <p style="margin: 8px 0 0 0;"><strong>New Schedule:</strong> Tomorrow at 10:00 AM</p>
          <p style="margin: 8px 0 0 0;"><strong>Job:</strong> TEST-12345</p>
        </div>
      `
    },
    maintenance_alert: {
      subject: '🔧 Test: Maintenance Alert',
      notificationType: 'maintenance_alerts',
      pushBody: 'Test Vehicle ABC-123: Oil change due in 3 days',
      emailContent: `
        <h2 style="color: #dc2626; margin-bottom: 16px;">Maintenance Alert (Test)</h2>
        <p>This is a test notification for maintenance alerts.</p>
        <div style="margin: 20px 0; padding: 20px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px;">
          <p style="margin: 0;"><strong>Vehicle:</strong> Test Truck (ABC-123)</p>
          <p style="margin: 8px 0 0 0;"><strong>Alert Type:</strong> Oil Change Due</p>
          <p style="margin: 8px 0 0 0;"><strong>Due Date:</strong> 3 days from now</p>
        </div>
      `
    },
    quote_update: {
      subject: '💼 Test: Quote Update',
      notificationType: 'customer_updates',
      pushBody: 'Test Quote #Q-12345 for Test Customer has been accepted',
      emailContent: `
        <h2 style="color: #16a34a; margin-bottom: 16px;">Quote Update (Test)</h2>
        <p>This is a test notification for quote updates.</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px;">
          <p style="margin: 0;"><strong>Quote Number:</strong> Q-12345</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> Test Customer</p>
          <p style="margin: 8px 0 0 0;"><strong>Status:</strong> Accepted</p>
          <p style="margin: 8px 0 0 0;"><strong>Amount:</strong> $1,250.00</p>
        </div>
      `
    },
    invoice_reminder: {
      subject: '💳 Test: Invoice Payment Reminder',
      notificationType: 'invoice_reminders',
      pushBody: 'Test: Invoice INV-12345 for $850.00 is due in 3 days',
      emailContent: `
        <h2 style="color: #ea580c; margin-bottom: 16px;">Invoice Reminder (Test)</h2>
        <p>This is a test notification for invoice reminders.</p>
        <div style="margin: 20px 0; padding: 20px; background: #fff7ed; border-left: 4px solid #ea580c; border-radius: 8px;">
          <p style="margin: 0;"><strong>Invoice Number:</strong> INV-12345</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> Test Customer</p>
          <p style="margin: 8px 0 0 0;"><strong>Amount Due:</strong> $850.00</p>
          <p style="margin: 8px 0 0 0;"><strong>Due Date:</strong> 3 days from now</p>
        </div>
      `
    },
    payment_confirmation: {
      subject: '✅ Test: Payment Received',
      notificationType: 'payment_confirmations',
      pushBody: 'Test: Payment of $850.00 received from Test Customer',
      emailContent: `
        <h2 style="color: #16a34a; margin-bottom: 16px;">Payment Confirmation (Test)</h2>
        <p>This is a test notification for payment confirmations.</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px;">
          <p style="margin: 0;"><strong>Amount:</strong> $850.00</p>
          <p style="margin: 8px 0 0 0;"><strong>Customer:</strong> Test Customer</p>
          <p style="margin: 8px 0 0 0;"><strong>Invoice:</strong> INV-12345</p>
          <p style="margin: 8px 0 0 0;"><strong>Payment Method:</strong> Credit Card</p>
        </div>
      `
    },
    low_stock_alert: {
      subject: '📦 Test: Low Stock Alert',
      notificationType: 'inventory_alerts',
      pushBody: 'Test: Toilet Paper is low - 5 units remaining (minimum 20)',
      emailContent: `
        <h2 style="color: #dc2626; margin-bottom: 16px;">Low Stock Alert (Test)</h2>
        <p>This is a test notification for low stock alerts.</p>
        <div style="margin: 20px 0; padding: 20px; background: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px;">
          <p style="margin: 0;"><strong>Item:</strong> Toilet Paper</p>
          <p style="margin: 8px 0 0 0;"><strong>Current Stock:</strong> 5 units</p>
          <p style="margin: 8px 0 0 0;"><strong>Minimum Required:</strong> 20 units</p>
          <p style="margin: 8px 0 0 0;"><strong>Action:</strong> Reorder needed</p>
        </div>
      `
    },
    asset_movement: {
      subject: '🚚 Test: Asset Movement',
      notificationType: 'dispatch_updates',
      pushBody: 'Test: Unit PT-123 has been deployed to Test Location',
      emailContent: `
        <h2 style="color: #2563eb; margin-bottom: 16px;">Asset Movement (Test)</h2>
        <p>This is a test notification for asset movements.</p>
        <div style="margin: 20px 0; padding: 20px; background: #eff6ff; border-left: 4px solid #2563eb; border-radius: 8px;">
          <p style="margin: 0;"><strong>Asset:</strong> Portable Toilet PT-123</p>
          <p style="margin: 8px 0 0 0;"><strong>Movement:</strong> Deployed</p>
          <p style="margin: 8px 0 0 0;"><strong>Location:</strong> Test Job Site</p>
          <p style="margin: 8px 0 0 0;"><strong>Job:</strong> TEST-12345</p>
        </div>
      `
    },
    vehicle_status_change: {
      subject: '🚛 Test: Vehicle Status Change',
      notificationType: 'maintenance_alerts',
      pushBody: 'Test: Truck ABC-123 status changed to Maintenance',
      emailContent: `
        <h2 style="color: #f59e0b; margin-bottom: 16px;">Vehicle Status Change (Test)</h2>
        <p>This is a test notification for vehicle status changes.</p>
        <div style="margin: 20px 0; padding: 20px; background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px;">
          <p style="margin: 0;"><strong>Vehicle:</strong> Test Truck (ABC-123)</p>
          <p style="margin: 8px 0 0 0;"><strong>Old Status:</strong> Available</p>
          <p style="margin: 8px 0 0 0;"><strong>New Status:</strong> Maintenance</p>
          <p style="margin: 8px 0 0 0;"><strong>Reason:</strong> Scheduled maintenance</p>
        </div>
      `
    },
    driver_checkin: {
      subject: '👤 Test: Driver Check-In',
      notificationType: 'dispatch_updates',
      pushBody: 'Test: John Doe completed route - 8 jobs finished',
      emailContent: `
        <h2 style="color: #16a34a; margin-bottom: 16px;">Driver Check-In (Test)</h2>
        <p>This is a test notification for driver check-ins.</p>
        <div style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-left: 4px solid #16a34a; border-radius: 8px;">
          <p style="margin: 0;"><strong>Driver:</strong> John Doe</p>
          <p style="margin: 8px 0 0 0;"><strong>Type:</strong> End of Shift</p>
          <p style="margin: 8px 0 0 0;"><strong>Jobs Completed:</strong> 8</p>
          <p style="margin: 8px 0 0 0;"><strong>Time:</strong> 5:30 PM</p>
        </div>
      `
    },
    new_team_member: {
      subject: '👥 Test: New Team Member',
      notificationType: 'system_updates',
      pushBody: 'Test: Jane Smith has joined as Driver',
      emailContent: `
        <h2 style="color: #7c3aed; margin-bottom: 16px;">New Team Member (Test)</h2>
        <p>This is a test notification for new team members.</p>
        <div style="margin: 20px 0; padding: 20px; background: #faf5ff; border-left: 4px solid #7c3aed; border-radius: 8px;">
          <p style="margin: 0;"><strong>Name:</strong> Jane Smith</p>
          <p style="margin: 8px 0 0 0;"><strong>Role:</strong> Driver</p>
          <p style="margin: 8px 0 0 0;"><strong>Start Date:</strong> Today</p>
        </div>
      `
    },
    comment_mention: {
      subject: '💬 Test: You Were Mentioned',
      notificationType: 'new_messages',
      pushBody: 'Test: John Doe mentioned you in a job note',
      emailContent: `
        <h2 style="color: #0891b2; margin-bottom: 16px;">Comment Mention (Test)</h2>
        <p>This is a test notification for comment mentions.</p>
        <div style="margin: 20px 0; padding: 20px; background: #ecfeff; border-left: 4px solid #0891b2; border-radius: 8px;">
          <p style="margin: 0;"><strong>Mentioned By:</strong> John Doe</p>
          <p style="margin: 8px 0 0 0;"><strong>Location:</strong> Job Note</p>
          <p style="margin: 8px 0 0 0;"><strong>Comment:</strong> "Hey @you, can you check this out?"</p>
          <p style="margin: 8px 0 0 0;"><strong>Entity:</strong> Job TEST-12345</p>
        </div>
      `
    }
  };

  return testDataMap[type] || testDataMap.job_assignment;
}

serve(handler);
