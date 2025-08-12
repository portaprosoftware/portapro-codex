import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

interface ExpirationItem {
  driver_id: string;
  driver_name: string;
  driver_email: string;
  item_type: 'license' | 'medical_card' | 'training' | 'certification';
  item_name: string;
  expiry_date: string;
  days_until_expiry: number;
  notification_intervals: number[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting driver expiration check...');
    
    const today = new Date();
    const expirationItems: ExpirationItem[] = [];

    // Check driver credentials (license and medical card)
    const { data: credentials, error: credentialsError } = await supabase
      .from('driver_credentials')
      .select(`
        driver_id,
        license_expiry_date,
        medical_card_expiry_date,
        profiles!inner(first_name, last_name, email)
      `);

    if (credentialsError) {
      console.error('Error fetching credentials:', credentialsError);
      throw credentialsError;
    }

    // Process license expirations
    credentials?.forEach((cred: any) => {
      const driverName = `${cred.profiles.first_name} ${cred.profiles.last_name}`;
      
      if (cred.license_expiry_date) {
        const expiryDate = new Date(cred.license_expiry_date);
        const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 90 && daysUntil >= -30) { // Include overdue items up to 30 days
          expirationItems.push({
            driver_id: cred.driver_id,
            driver_name: driverName,
            driver_email: cred.profiles.email,
            item_type: 'license',
            item_name: 'Driver License',
            expiry_date: cred.license_expiry_date,
            days_until_expiry: daysUntil,
            notification_intervals: [90, 60, 30, 7, 0, -7, -14, -30]
          });
        }
      }

      if (cred.medical_card_expiry_date) {
        const expiryDate = new Date(cred.medical_card_expiry_date);
        const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntil <= 90 && daysUntil >= -30) {
          expirationItems.push({
            driver_id: cred.driver_id,
            driver_name: driverName,
            driver_email: cred.profiles.email,
            item_type: 'medical_card',
            item_name: 'Medical Card',
            expiry_date: cred.medical_card_expiry_date,
            days_until_expiry: daysUntil,
            notification_intervals: [90, 60, 30, 7, 0, -7, -14, -30]
          });
        }
      }
    });

    // Check training records
    const { data: training, error: trainingError } = await supabase
      .from('driver_training_records')
      .select(`
        driver_id,
        training_type,
        next_due,
        profiles!inner(first_name, last_name, email)
      `)
      .not('next_due', 'is', null);

    if (trainingError) {
      console.error('Error fetching training records:', trainingError);
      throw trainingError;
    }

    training?.forEach((train: any) => {
      const driverName = `${train.profiles.first_name} ${train.profiles.last_name}`;
      const expiryDate = new Date(train.next_due);
      const daysUntil = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysUntil <= 90 && daysUntil >= -30) {
        expirationItems.push({
          driver_id: train.driver_id,
          driver_name: driverName,
          driver_email: train.profiles.email,
          item_type: 'training',
          item_name: train.training_type,
          expiry_date: train.next_due,
          days_until_expiry: daysUntil,
          notification_intervals: [90, 60, 30, 7, 0, -7, -14, -30]
        });
      }
    });

    console.log(`Found ${expirationItems.length} items to check for notifications`);

    // Send notifications for items that need them
    const notifications = [];
    
    for (const item of expirationItems) {
      // Check if we should send a notification today
      if (item.notification_intervals.includes(item.days_until_expiry)) {
        
        // Check if we already sent this notification recently
        const { data: recentNotification } = await supabase
          .from('driver_activity_log')
          .select('id')
          .eq('driver_id', item.driver_id)
          .eq('action_type', 'expiration_notification')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
          .like('action_details', `%${item.item_type}%`)
          .maybeSingle();

        if (!recentNotification) {
          try {
            const emailSubject = item.days_until_expiry <= 0 
              ? `URGENT: Your ${item.item_name} has expired`
              : `Reminder: Your ${item.item_name} expires in ${item.days_until_expiry} days`;

            const emailContent = item.days_until_expiry <= 0
              ? `
                <h2>URGENT: Document Expired</h2>
                <p>Hi ${item.driver_name},</p>
                <p>Your <strong>${item.item_name}</strong> expired ${Math.abs(item.days_until_expiry)} days ago on ${new Date(item.expiry_date).toLocaleDateString()}.</p>
                <p><strong>You must update this document immediately to continue driving.</strong></p>
                <p>Please contact your supervisor or HR department to update your documentation.</p>
                <p>Best regards,<br>PortaPro Team</p>
              `
              : `
                <h2>Document Expiration Reminder</h2>
                <p>Hi ${item.driver_name},</p>
                <p>Your <strong>${item.item_name}</strong> will expire in <strong>${item.days_until_expiry} days</strong> on ${new Date(item.expiry_date).toLocaleDateString()}.</p>
                <p>Please make arrangements to renew this document before it expires to avoid any interruption to your driving duties.</p>
                <p>If you need assistance, please contact your supervisor or HR department.</p>
                <p>Best regards,<br>PortaPro Team</p>
              `;

            await resend.emails.send({
              from: 'PortaPro <notifications@portapro.app>',
              to: [item.driver_email],
              subject: emailSubject,
              html: emailContent,
            });

            // Log the notification
            await supabase
              .from('driver_activity_log')
              .insert({
                driver_id: item.driver_id,
                action_type: 'expiration_notification',
                action_details: {
                  item_type: item.item_type,
                  item_name: item.item_name,
                  days_until_expiry: item.days_until_expiry,
                  expiry_date: item.expiry_date,
                  notification_sent: true
                },
                performed_by: 'system'
              });

            notifications.push({
              driver_name: item.driver_name,
              item_name: item.item_name,
              days_until_expiry: item.days_until_expiry,
              status: 'sent'
            });

            console.log(`Notification sent to ${item.driver_name} for ${item.item_name}`);

          } catch (emailError) {
            console.error(`Failed to send notification to ${item.driver_name}:`, emailError);
            
            notifications.push({
              driver_name: item.driver_name,
              item_name: item.item_name,
              days_until_expiry: item.days_until_expiry,
              status: 'failed',
              error: emailError.message
            });
          }
        }
      }
    }

    // Send manager digest if there are critical items
    const criticalItems = expirationItems.filter(item => item.days_until_expiry <= 7);
    
    if (criticalItems.length > 0) {
      // Get company settings for notification email
      const { data: companySettings } = await supabase
        .from('company_settings')
        .select('support_email')
        .limit(1)
        .maybeSingle();

      if (companySettings?.support_email) {
        const digestContent = `
          <h2>Driver Compliance Digest - Critical Items</h2>
          <p>The following driver documents require immediate attention:</p>
          <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th>Driver</th>
                <th>Document</th>
                <th>Status</th>
                <th>Expiry Date</th>
              </tr>
            </thead>
            <tbody>
              ${criticalItems.map(item => `
                <tr>
                  <td>${item.driver_name}</td>
                  <td>${item.item_name}</td>
                  <td style="color: ${item.days_until_expiry <= 0 ? 'red' : 'orange'}">
                    ${item.days_until_expiry <= 0 ? 'EXPIRED' : `${item.days_until_expiry} days left`}
                  </td>
                  <td>${new Date(item.expiry_date).toLocaleDateString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <p>Please take appropriate action to ensure compliance.</p>
          <p>Best regards,<br>PortaPro System</p>
        `;

        try {
          await resend.emails.send({
            from: 'PortaPro <notifications@portapro.app>',
            to: [companySettings.support_email],
            subject: `Driver Compliance Alert - ${criticalItems.length} Critical Items`,
            html: digestContent,
          });

          console.log('Manager digest sent successfully');
        } catch (digestError) {
          console.error('Failed to send manager digest:', digestError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        items_checked: expirationItems.length,
        notifications_sent: notifications.filter(n => n.status === 'sent').length,
        notifications_failed: notifications.filter(n => n.status === 'failed').length,
        critical_items: criticalItems.length,
        notifications
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in check-driver-expirations function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});