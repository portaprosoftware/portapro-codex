import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ServicePDFRequest {
  report_id: string;
  action: 'generate_pdf' | 'send_email' | 'both';
  recipient_email?: string;
  recipient_name?: string;
  subject?: string;
  message?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const requestData: ServicePDFRequest = await req.json();

    console.log('Processing service PDF request:', requestData);

    // Fetch the service report data with related information
    const { data: report, error: reportError } = await supabase
      .from('maintenance_reports')
      .select(`
        *,
        customers:customer_id (
          name,
          email,
          phone,
          service_street,
          service_city,
          service_state,
          service_zip
        ),
        profiles:assigned_technician (
          first_name,
          last_name,
          email
        ),
        maintenance_report_templates:template_id (
          name,
          template_data
        )
      `)
      .eq('id', requestData.report_id)
      .single();

    if (reportError) {
      console.error('Error fetching report:', reportError);
      throw reportError;
    }

    // Generate comprehensive service report HTML
    const pdfHtml = generateServiceReportHtml(report);

    let pdfBuffer;
    if (requestData.action === 'generate_pdf' || requestData.action === 'both') {
      // For now, we'll return the HTML. In production, you'd use a service like Puppeteer
      pdfBuffer = new TextEncoder().encode(pdfHtml);
    }

    // Send email if requested
    if (requestData.action === 'send_email' || requestData.action === 'both') {
      const emailSubject = requestData.subject || 
        `Service Report ${report.report_number} - ${report.customers?.name || 'Service Completed'}`;
      
      const emailMessage = requestData.message || 
        `Please find attached your service report for the work completed.`;

      const emailData = {
        from: "PortaPro Services <services@resend.dev>",
        to: [requestData.recipient_email || report.customers?.email],
        subject: emailSubject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Hello ${requestData.recipient_name || report.customers?.name},</h2>
            <p>${emailMessage}</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${pdfHtml}
            </div>
            <p>Thank you for choosing PortaPro Services!</p>
            <p>Best regards,<br>PortaPro Team</p>
          </div>
        `,
      };

      const emailResponse = await resend.emails.send(emailData);
      console.log('Service report email sent successfully:', emailResponse);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Service report ${requestData.action} completed successfully`,
        pdf_available: requestData.action === 'generate_pdf' || requestData.action === 'both',
        report_number: report.report_number
      }), 
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error("Error in generate-service-pdf function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateServiceReportHtml(report: any): string {
  const reportData = report.report_data || {};
  const customer = report.customers;
  const technician = report.profiles;
  const template = report.maintenance_report_templates;
  
  return `
    <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
        <div>
          <h1 style="color: #2563eb; margin: 0; font-size: 32px;">SERVICE REPORT</h1>
          <p style="margin: 5px 0; color: #666; font-size: 18px;">${report.report_number}</p>
          <p style="margin: 5px 0; color: #666;">Status: <span style="background: ${getStatusColor(report.status)}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">${report.status.toUpperCase()}</span></p>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; color: #333; font-size: 24px;">PortaPro</h2>
          <p style="margin: 5px 0; color: #666;">Professional Service Solutions</p>
          <p style="margin: 5px 0; color: #666;">Date: ${new Date(report.created_at).toLocaleDateString()}</p>
          ${report.completed_at ? `<p style="margin: 5px 0; color: #666;">Completed: ${new Date(report.completed_at).toLocaleDateString()}</p>` : ''}
        </div>
      </div>

      <!-- Service Information Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px;">
        <!-- Customer Information -->
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Customer Information</h3>
          <div style="color: #666;">
            <p style="margin: 8px 0; font-weight: bold; font-size: 16px;">${customer?.name || 'N/A'}</p>
            ${customer?.service_street ? `<p style="margin: 5px 0;">${customer.service_street}</p>` : ''}
            ${customer?.service_city ? `<p style="margin: 5px 0;">${customer.service_city}, ${customer.service_state || ''} ${customer.service_zip || ''}</p>` : ''}
            ${customer?.email ? `<p style="margin: 5px 0;">Email: ${customer.email}</p>` : ''}
            ${customer?.phone ? `<p style="margin: 5px 0;">Phone: ${customer.phone}</p>` : ''}
          </div>
        </div>

        <!-- Service Details -->
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Service Details</h3>
          <div style="color: #666;">
            <p style="margin: 8px 0;"><strong>Service Type:</strong> ${reportData.service_type || 'General Service'}</p>
            <p style="margin: 8px 0;"><strong>Priority:</strong> ${report.priority_level || 'Medium'}</p>
            <p style="margin: 8px 0;"><strong>Progress:</strong> ${report.completion_percentage || 0}%</p>
            ${technician ? `<p style="margin: 8px 0;"><strong>Technician:</strong> ${technician.first_name} ${technician.last_name}</p>` : ''}
            ${report.estimated_completion ? `<p style="margin: 8px 0;"><strong>Est. Completion:</strong> ${new Date(report.estimated_completion).toLocaleDateString()}</p>` : ''}
            ${reportData.duration_hours ? `<p style="margin: 8px 0;"><strong>Duration:</strong> ${reportData.duration_hours} hours</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Location and Weather -->
      ${reportData.location || report.weather_conditions ? `
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #22c55e; padding-bottom: 8px;">Location & Conditions</h3>
          ${reportData.location ? `<p style="margin: 8px 0; color: #666;"><strong>Location:</strong> ${reportData.location}</p>` : ''}
          ${report.weather_conditions ? `<p style="margin: 8px 0; color: #666;"><strong>Weather:</strong> ${report.weather_conditions}</p>` : ''}
          ${report.location_coordinates ? `<p style="margin: 8px 0; color: #666;"><strong>GPS Coordinates:</strong> Available</p>` : ''}
        </div>
      ` : ''}

      <!-- Service Description -->
      ${reportData.description || reportData.work_performed ? `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Service Description</h3>
          <div style="background: white; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${reportData.description || reportData.work_performed || 'No description provided.'}</p>
          </div>
        </div>
      ` : ''}

      <!-- Template Fields -->
      ${template?.template_data ? generateTemplateFields(template.template_data, reportData) : ''}

      <!-- Parts and Materials -->
      ${reportData.parts_used || reportData.materials ? `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #f59e0b; padding-bottom: 8px;">Parts & Materials</h3>
          <div style="background: #fffbeb; padding: 20px; border-radius: 8px;">
            ${reportData.parts_used ? `<p style="margin: 8px 0; color: #666;"><strong>Parts Used:</strong></p><ul style="margin: 0; padding-left: 20px; color: #666;">${reportData.parts_used.split(',').map((part: string) => `<li style="margin: 4px 0;">${part.trim()}</li>`).join('')}</ul>` : ''}
            ${reportData.materials ? `<p style="margin: 8px 0; color: #666;"><strong>Materials:</strong> ${reportData.materials}</p>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Cost Information -->
      ${reportData.labor_cost || reportData.parts_cost || reportData.total_cost ? `
        <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">Cost Breakdown</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            ${reportData.labor_cost ? `<div><p style="margin: 0; color: #666;"><strong>Labor:</strong></p><p style="margin: 5px 0; font-size: 18px; color: #22c55e; font-weight: bold;">$${Number(reportData.labor_cost).toFixed(2)}</p></div>` : ''}
            ${reportData.parts_cost ? `<div><p style="margin: 0; color: #666;"><strong>Parts:</strong></p><p style="margin: 5px 0; font-size: 18px; color: #22c55e; font-weight: bold;">$${Number(reportData.parts_cost).toFixed(2)}</p></div>` : ''}
            ${reportData.total_cost ? `<div><p style="margin: 0; color: #666;"><strong>Total:</strong></p><p style="margin: 5px 0; font-size: 20px; color: #2563eb; font-weight: bold;">$${Number(reportData.total_cost).toFixed(2)}</p></div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Notes and Recommendations -->
      ${reportData.notes || reportData.recommendations ? `
        <div style="margin-bottom: 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #ef4444; padding-bottom: 8px;">Notes & Recommendations</h3>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px;">
            ${reportData.notes ? `<div style="margin-bottom: 15px;"><p style="margin: 0 0 8px 0; color: #666; font-weight: bold;">Notes:</p><p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${reportData.notes}</p></div>` : ''}
            ${reportData.recommendations ? `<div><p style="margin: 0 0 8px 0; color: #666; font-weight: bold;">Recommendations:</p><p style="margin: 0; color: #666; line-height: 1.6; white-space: pre-wrap;">${reportData.recommendations}</p></div>` : ''}
          </div>
        </div>
      ` : ''}

      <!-- Signatures -->
      ${reportData.customer_signature || reportData.technician_signature ? `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
          ${reportData.technician_signature ? `
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #666; margin-bottom: 10px; height: 60px; display: flex; align-items: end; justify-content: center;">
                <span style="color: #2563eb; font-weight: bold;">Technician Signed</span>
              </div>
              <p style="margin: 0; color: #666; font-size: 14px;">Technician Signature</p>
              <p style="margin: 0; color: #666; font-size: 12px;">${new Date(report.completed_at || report.updated_at).toLocaleDateString()}</p>
            </div>
          ` : ''}
          ${reportData.customer_signature ? `
            <div style="text-align: center;">
              <div style="border-bottom: 1px solid #666; margin-bottom: 10px; height: 60px; display: flex; align-items: end; justify-content: center;">
                <span style="color: #22c55e; font-weight: bold;">Customer Signed</span>
              </div>
              <p style="margin: 0; color: #666; font-size: 14px;">Customer Signature</p>
              <p style="margin: 0; color: #666; font-size: 12px;">${new Date().toLocaleDateString()}</p>
            </div>
          ` : ''}
        </div>
      ` : ''}

      <!-- Footer -->
      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #2563eb; text-align: center; color: #666;">
        <p style="margin: 0; font-size: 14px;">This report was generated automatically by PortaPro Services</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">For questions about this service, please contact us at services@portapro.com</p>
      </div>
    </div>
  `;
}

function generateTemplateFields(templateData: any, reportData: any): string {
  if (!templateData || typeof templateData !== 'object') return '';
  
  const fields = Object.keys(templateData).filter(key => templateData[key] && reportData[key]);
  if (fields.length === 0) return '';

  return `
    <div style="margin-bottom: 30px;">
      <h3 style="margin: 0 0 15px 0; color: #333; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px;">Additional Information</h3>
      <div style="background: #faf5ff; padding: 20px; border-radius: 8px;">
        ${fields.map(field => `
          <div style="margin-bottom: 12px;">
            <p style="margin: 0 0 4px 0; color: #666; font-weight: bold;">${field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</p>
            <p style="margin: 0; color: #666; line-height: 1.4;">${reportData[field]}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case 'completed': return '#22c55e';
    case 'in_progress': return '#3b82f6';
    case 'open': case 'scheduled': return '#f59e0b';
    case 'overdue': return '#ef4444';
    default: return '#6b7280';
  }
}

serve(handler);