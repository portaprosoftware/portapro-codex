import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Checking for expiring documents...');

    // Get expiring documents from the view
    const { data: expiringDocs, error: docsError } = await supabase
      .from('expiring_documents')
      .select('*');

    if (docsError) {
      console.error('Error fetching expiring documents:', docsError);
      throw docsError;
    }

    console.log(`Found ${expiringDocs?.length || 0} expiring documents`);

    // Get notification settings
    const { data: settings } = await supabase
      .from('document_notification_settings')
      .select('*')
      .single();

    if (!settings?.dashboard_alerts && !settings?.email_notifications) {
      console.log('Notifications are disabled');
      return new Response(
        JSON.stringify({ message: 'Notifications disabled', count: expiringDocs?.length || 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark documents as reminder sent
    for (const doc of expiringDocs || []) {
      if (!doc.reminder_sent) {
        await supabase
          .from('vehicle_documents')
          .update({ 
            reminder_sent: true,
            last_reminder_sent_at: new Date().toISOString()
          })
          .eq('id', doc.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        expiring_count: expiringDocs?.length || 0,
        documents: expiringDocs 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in check-document-expirations:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
