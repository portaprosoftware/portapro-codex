import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { Resend } from "npm:resend@4.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduledReport {
  id: string;
  name: string;
  description?: string;
  preset_id?: string;
  schedule_type: string;
  schedule_config: any;
  email_recipients: string[];
  filter_presets?: {
    filter_data: any;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const resend = new Resend(resendApiKey);

    console.log('Running scheduled reports...');

    // Get all active scheduled reports that are due to run
    const { data: dueReports, error: fetchError } = await supabase
      .from('scheduled_reports')
      .select(`
        *,
        filter_presets!preset_id (
          filter_data
        )
      `)
      .eq('is_active', true)
      .lt('next_run_at', new Date().toISOString())
      .order('next_run_at');

    if (fetchError) {
      throw new Error(`Failed to fetch due reports: ${fetchError.message}`);
    }

    console.log(`Found ${dueReports?.length || 0} reports due for execution`);

    if (!dueReports || dueReports.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'No reports due for execution',
        processed: 0
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let processedCount = 0;
    const results = [];

    for (const report of dueReports as ScheduledReport[]) {
      try {
        console.log(`Processing report: ${report.name} (${report.id})`);

        // Create execution record
        const { data: execution, error: execError } = await supabase
          .from('report_executions')
          .insert({
            scheduled_report_id: report.id,
            execution_status: 'running',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (execError) {
          throw new Error(`Failed to create execution record: ${execError.message}`);
        }

        // Get filter data from preset or use default
        const filterData = report.filter_presets?.filter_data || {};
        
        // Fetch jobs based on filter criteria
        let jobsQuery = supabase
          .from('jobs')
          .select(`
            *,
            customers(id, name, service_street, service_city, service_state),
            profiles:driver_id(id, first_name, last_name),
            vehicles(id, license_plate, vehicle_type)
          `);

        // Apply filters
        if (filterData.selectedDriver && filterData.selectedDriver !== 'all') {
          jobsQuery = jobsQuery.eq('driver_id', filterData.selectedDriver);
        }
        if (filterData.selectedStatus && filterData.selectedStatus !== 'all') {
          jobsQuery = jobsQuery.eq('status', filterData.selectedStatus);
        }
        if (filterData.selectedJobType && filterData.selectedJobType !== 'all') {
          jobsQuery = jobsQuery.eq('job_type', filterData.selectedJobType);
        }
        if (filterData.dateRange?.from && filterData.dateRange?.to) {
          jobsQuery = jobsQuery
            .gte('scheduled_date', filterData.dateRange.from)
            .lte('scheduled_date', filterData.dateRange.to);
        }

        const { data: jobs, error: jobsError } = await jobsQuery
          .order('scheduled_date', { ascending: false })
          .limit(100);

        if (jobsError) {
          throw new Error(`Failed to fetch jobs: ${jobsError.message}`);
        }

        console.log(`Found ${jobs?.length || 0} jobs for report ${report.name}`);

        // Generate PDF report via existing edge function
        const { data: pdfData, error: pdfError } = await supabase.functions.invoke('generate-enhanced-pdf', {
          body: {
            jobs: jobs || [],
            filterContext: {
              ...filterData,
              presetName: report.name,
              runBy: 'Automated System'
            },
            totalCount: jobs?.length || 0,
          }
        });

        if (pdfError) {
          throw new Error(`Failed to generate PDF: ${pdfError.message}`);
        }

        // Send email to recipients
        const emailPromises = report.email_recipients.map(async (email) => {
          return resend.emails.send({
            from: 'PortaPro Reports <reports@portapro.app>',
            to: [email],
            subject: `${report.name} - ${new Date().toLocaleDateString()}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                  ${report.name}
                </h2>
                
                <p style="color: #666; margin-bottom: 20px;">
                  Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
                </p>
                
                ${report.description ? `
                  <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                    <p style="margin: 0; color: #374151;">${report.description}</p>
                  </div>
                ` : ''}
                
                <div style="background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                  <h3 style="margin-top: 0; color: #1f2937;">Report Summary</h3>
                  <p style="margin: 5px 0;"><strong>Jobs Found:</strong> ${jobs?.length || 0}</p>
                  <p style="margin: 5px 0;"><strong>Report Type:</strong> ${report.schedule_type.charAt(0).toUpperCase() + report.schedule_type.slice(1)}</p>
                  <p style="margin: 5px 0;"><strong>Next Report:</strong> ${new Date(await calculateNextRunTime(report.schedule_type, report.schedule_config)).toLocaleDateString()}</p>
                </div>
                
                <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                  <p style="margin: 0; color: #0c4a6e;">
                    📄 <strong>Enhanced PDF Report Available:</strong> The full report with charts, maps, and detailed job information is attached to this email.
                  </p>
                </div>
                
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                
                <p style="color: #6b7280; font-size: 12px; text-align: center;">
                  This is an automated report from PortaPro. 
                  <br>
                  To modify or stop these reports, please contact your administrator.
                </p>
              </div>
            `,
            attachments: pdfData?.htmlContent ? [{
              filename: `${report.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.html`,
              content: Buffer.from(pdfData.htmlContent).toString('base64'),
              type: 'text/html'
            }] : undefined
          });
        });

        await Promise.all(emailPromises);

        // Update execution record
        await supabase
          .from('report_executions')
          .update({
            execution_status: 'completed',
            completed_at: new Date().toISOString(),
            results_count: jobs?.length || 0,
            email_sent: true,
            report_data: { filter_data: filterData, jobs_count: jobs?.length || 0 }
          })
          .eq('id', execution.id);

        // Update scheduled report with next run time
        const nextRunTime = await calculateNextRunTime(report.schedule_type, report.schedule_config);
        await supabase
          .from('scheduled_reports')
          .update({
            last_run_at: new Date().toISOString(),
            next_run_at: nextRunTime
          })
          .eq('id', report.id);

        processedCount++;
        results.push({
          reportId: report.id,
          reportName: report.name,
          status: 'completed',
          jobsCount: jobs?.length || 0,
          recipientCount: report.email_recipients.length
        });

        console.log(`Successfully processed report: ${report.name}`);

      } catch (reportError) {
        console.error(`Failed to process report ${report.name}:`, reportError);
        
        // Update execution record with error
        await supabase
          .from('report_executions')
          .update({
            execution_status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: reportError.message
          })
          .eq('scheduled_report_id', report.id)
          .eq('execution_status', 'running');

        results.push({
          reportId: report.id,
          reportName: report.name,
          status: 'failed',
          error: reportError.message
        });
      }
    }

    console.log(`Processed ${processedCount} reports successfully`);

    return new Response(JSON.stringify({
      success: true,
      message: `Processed ${processedCount} scheduled reports`,
      processed: processedCount,
      results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in scheduled reports execution:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function calculateNextRunTime(scheduleType: string, scheduleConfig: any): Promise<string> {
  const now = new Date();
  const hour = scheduleConfig.hour || 8;
  
  let nextRun = new Date();
  nextRun.setHours(hour, 0, 0, 0);
  
  switch (scheduleType) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
    case 'weekly':
      const dayOfWeek = scheduleConfig.day_of_week || 1; // Monday
      const daysUntilTarget = (dayOfWeek - nextRun.getDay() + 7) % 7;
      nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7));
      break;
    case 'monthly':
      const dayOfMonth = scheduleConfig.day_of_month || 1;
      nextRun.setDate(dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }
  
  return nextRun.toISOString();
}