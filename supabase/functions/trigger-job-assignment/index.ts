import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobAssignmentRequest {
  jobId: string;
  driverId: string;
  jobNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string;
  locationAddress: string;
  specialInstructions?: string;
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
      jobId, 
      driverId, 
      jobNumber,
      customerName,
      serviceType,
      scheduledDate,
      scheduledTime,
      locationAddress,
      specialInstructions 
    }: JobAssignmentRequest = await req.json();

    console.log('Processing job assignment notification:', { jobId, driverId, jobNumber });

    if (!jobId || !driverId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: jobId and driverId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate email content
    const emailSubject = `New Job Assignment: ${jobNumber}`;
    const emailContent = `
      <h2>New Job Assignment</h2>
      <p>You have been assigned to a new job:</p>
      
      <div class="info-box">
        <p><strong>Job #:</strong> ${jobNumber}</p>
        <p><strong>Customer:</strong> ${customerName}</p>
        <p><strong>Service Type:</strong> ${serviceType}</p>
        <p><strong>Scheduled:</strong> ${scheduledDate}${scheduledTime ? ' at ' + scheduledTime : ''}</p>
        <p><strong>Location:</strong> ${locationAddress}</p>
        ${specialInstructions ? `<p><strong>Special Instructions:</strong> ${specialInstructions}</p>` : ''}
      </div>
      
      <p style="text-align: center;">
        <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/jobs/${jobId}" class="button">View Job Details</a>
      </p>
    `;

    // Send email notification
    const emailResult = await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: driverId,
        notificationType: 'job_assignments',
        subject: emailSubject,
        htmlContent: emailContent,
        data: {
          jobId,
          jobNumber,
          customerName,
          serviceType,
          scheduledDate,
          scheduledTime,
        }
      }
    });

    if (emailResult.error) {
      console.error('Error sending email notification:', emailResult.error);
    } else {
      console.log('Email notification sent successfully:', emailResult.data);
    }

    // Send push notification
    const pushResult = await supabase.functions.invoke('send-push-notification', {
      body: {
        userId: driverId,
        title: 'New Job Assignment',
        body: `${jobNumber} - ${customerName} scheduled for ${scheduledDate}`,
        notificationType: 'job_assignments',
        url: `/jobs/${jobId}`,
        data: {
          jobId,
          jobNumber,
          customerName,
        }
      }
    });

    if (pushResult.error) {
      console.error('Error sending push notification:', pushResult.error);
    } else {
      console.log('Push notification sent successfully:', pushResult.data);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Job assignment notifications sent',
        email: emailResult.data,
        push: pushResult.data
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in trigger-job-assignment function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
};

serve(handler);
