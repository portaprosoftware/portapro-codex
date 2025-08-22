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

async function generateServiceReportHtml(report: any, supabase: any): Promise<string> {
  const reportData = report.report_data || {};
  const customer = report.customers;
  const technician = report.profiles;
  const template = report.maintenance_report_templates;
  
  // Fetch company settings for branding
  const { data: companySettings } = await supabase
    .from('company_settings')
    .select('company_name, company_logo, company_email, company_phone, company_address')
    .single();
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Service Report ${report.report_number}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      margin: 0; 
      padding: 0; 
      background: #ffffff;
      color: #1f2937;
      line-height: 1.5;
    }
    
    .document-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 40px;
      background: white;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 3px solid;
      border-image: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%)) 1;
    }
    
    .company-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .company-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
    }
    
    .company-details h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
    }
    
    .company-details p {
      margin: 4px 0;
      font-size: 14px;
      color: #6b7280;
    }
    
    .document-banner {
      text-align: right;
    }
    
    .document-title {
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 8px;
      display: inline-block;
    }
    
    .status-badge {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      border: 1px solid;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-bottom: 30px;
    }
    
    .info-card {
      background: #f9fafb;
      padding: 24px;
      border-radius: 12px;
      border-left: 4px solid hsl(214, 83%, 56%);
    }
    
    .info-card.service-details {
      border-left-color: hsl(195, 84%, 65%);
    }
    
    .info-card.location-info {
      border-left-color: #22c55e;
      background: #f0fdf4;
    }
    
    .info-card.cost-info {
      border-left-color: #f59e0b;
      background: #fffbeb;
    }
    
    .info-card.notes-info {
      border-left-color: #ef4444;
      background: #fef2f2;
    }
    
    .info-card h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .customer-name {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .info-row {
      margin: 8px 0;
      font-size: 14px;
      color: #4b5563;
    }
    
    .info-row strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin: 8px 0;
    }
    
    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      transition: width 0.3s ease;
    }
    
    .description-section {
      background: white;
      padding: 24px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      margin-bottom: 30px;
    }
    
    .description-content {
      color: #4b5563;
      line-height: 1.6;
      white-space: pre-wrap;
    }
    
    .cost-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 20px;
    }
    
    .cost-item {
      text-align: center;
    }
    
    .cost-label {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 4px;
    }
    
    .cost-value {
      font-size: 18px;
      font-weight: 700;
      color: #22c55e;
    }
    
    .cost-value.total {
      font-size: 20px;
      color: hsl(214, 83%, 56%);
    }
    
    .signature-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 2px solid #e5e7eb;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-line {
      border-bottom: 2px solid #d1d5db;
      margin-bottom: 8px;
      height: 60px;
      display: flex;
      align-items: end;
      justify-content: center;
      border-radius: 4px;
    }
    
    .signature-status {
      font-weight: 600;
      padding: 8px 16px;
      border-radius: 20px;
    }
    
    .signature-status.signed {
      background: #dcfce7;
      color: #166534;
    }
    
    .signature-label {
      font-size: 14px;
      color: #6b7280;
      font-weight: 500;
      margin-top: 8px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    @media print {
      .document-container { padding: 20px; }
      .signature-section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <!-- Header Section -->
    <div class="header-section">
      <div class="company-info">
        ${companySettings?.company_logo ? `
          <img src="${companySettings.company_logo}" alt="Company Logo" class="company-logo" />
        ` : ''}
        <div class="company-details">
          <h1>${companySettings?.company_name || 'PortaPro'}</h1>
          <p>Professional Service Solutions</p>
          ${companySettings?.company_email ? `<p>📧 ${companySettings.company_email}</p>` : ''}
          ${companySettings?.company_phone ? `<p>📞 ${companySettings.company_phone}</p>` : ''}
        </div>
      </div>
      <div class="document-banner">
        <div class="document-title">🔧 SERVICE REPORT ${report.report_number}</div>
        <div class="status-badge" style="background: ${getStatusColor(report.status)}; color: white; border-color: ${getStatusColor(report.status)};">
          ${report.status.replace('_', ' ').toUpperCase()}
        </div>
        <div style="margin-top: 12px; font-size: 12px; color: #6b7280;">
          <div><strong>Created:</strong> ${new Date(report.created_at).toLocaleDateString()}</div>
          ${report.completed_at ? `<div><strong>Completed:</strong> ${new Date(report.completed_at).toLocaleDateString()}</div>` : ''}
        </div>
      </div>
    </div>

    <!-- Service Information Grid -->
    <div class="info-grid">
      <!-- Customer Information -->
      <div class="info-card">
        <h3>👤 Customer Information</h3>
        <div class="customer-name">${customer?.name || 'N/A'}</div>
        ${customer?.service_street ? `
          <div class="info-row">
            📍 ${customer.service_street}<br>
            ${customer.service_city || ''}, ${customer.service_state || ''} ${customer.service_zip || ''}
          </div>
        ` : ''}
        ${customer?.email ? `<div class="info-row">✉️ ${customer.email}</div>` : ''}
        ${customer?.phone ? `<div class="info-row">☎️ ${customer.phone}</div>` : ''}
      </div>

      <!-- Service Details -->
      <div class="info-card service-details">
        <h3>🔧 Service Details</h3>
        <div class="info-row"><strong>Service Type:</strong> ${reportData.service_type || 'General Service'}</div>
        <div class="info-row"><strong>Priority:</strong> ${report.priority_level || 'Medium'}</div>
        <div class="info-row">
          <strong>Progress:</strong> ${report.completion_percentage || 0}%
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${report.completion_percentage || 0}%;"></div>
          </div>
        </div>
        ${technician ? `<div class="info-row"><strong>Technician:</strong> ${technician.first_name} ${technician.last_name}</div>` : ''}
        ${report.estimated_completion ? `<div class="info-row"><strong>Est. Completion:</strong> ${new Date(report.estimated_completion).toLocaleDateString()}</div>` : ''}
        ${reportData.duration_hours ? `<div class="info-row"><strong>Duration:</strong> ${reportData.duration_hours} hours</div>` : ''}
      </div>
    </div>

    <!-- Location and Weather -->
    ${reportData.location || report.weather_conditions ? `
      <div class="info-card location-info" style="margin-bottom: 30px;">
        <h3>🌍 Location & Conditions</h3>
        ${reportData.location ? `<div class="info-row"><strong>Location:</strong> ${reportData.location}</div>` : ''}
        ${report.weather_conditions ? `<div class="info-row"><strong>Weather:</strong> ${report.weather_conditions}</div>` : ''}
        ${report.location_coordinates ? `<div class="info-row"><strong>GPS Coordinates:</strong> Available</div>` : ''}
      </div>
    ` : ''}

    <!-- Service Description -->
    ${reportData.description || reportData.work_performed ? `
      <div style="margin-bottom: 30px;">
        <h3 style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
          📝 Service Description
        </h3>
        <div class="description-section">
          <div class="description-content">${reportData.description || reportData.work_performed || 'No description provided.'}</div>
        </div>
      </div>
    ` : ''}

    <!-- Template Fields -->
    ${template?.template_data ? generateTemplateFields(template.template_data, reportData) : ''}

    <!-- Parts and Materials -->
    ${reportData.parts_used || reportData.materials ? `
      <div class="info-card cost-info" style="margin-bottom: 30px;">
        <h3>🔩 Parts & Materials</h3>
        ${reportData.parts_used ? `
          <div class="info-row"><strong>Parts Used:</strong></div>
          <ul style="margin: 8px 0; padding-left: 20px; color: #4b5563;">
            ${reportData.parts_used.split(',').map((part: string) => `<li style="margin: 4px 0;">${part.trim()}</li>`).join('')}
          </ul>
        ` : ''}
        ${reportData.materials ? `<div class="info-row"><strong>Materials:</strong> ${reportData.materials}</div>` : ''}
      </div>
    ` : ''}

    <!-- Cost Information -->
    ${reportData.labor_cost || reportData.parts_cost || reportData.total_cost ? `
      <div class="info-card cost-info" style="margin-bottom: 30px;">
        <h3>💰 Cost Breakdown</h3>
        <div class="cost-grid">
          ${reportData.labor_cost ? `
            <div class="cost-item">
              <div class="cost-label">Labor</div>
              <div class="cost-value">$${Number(reportData.labor_cost).toFixed(2)}</div>
            </div>
          ` : ''}
          ${reportData.parts_cost ? `
            <div class="cost-item">
              <div class="cost-label">Parts</div>
              <div class="cost-value">$${Number(reportData.parts_cost).toFixed(2)}</div>
            </div>
          ` : ''}
          ${reportData.total_cost ? `
            <div class="cost-item">
              <div class="cost-label">Total</div>
              <div class="cost-value total">$${Number(reportData.total_cost).toFixed(2)}</div>
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <!-- Notes and Recommendations -->
    ${reportData.notes || reportData.recommendations ? `
      <div class="info-card notes-info" style="margin-bottom: 30px;">
        <h3>📋 Notes & Recommendations</h3>
        ${reportData.notes ? `
          <div style="margin-bottom: 16px;">
            <div class="info-row"><strong>Notes:</strong></div>
            <div class="description-content">${reportData.notes}</div>
          </div>
        ` : ''}
        ${reportData.recommendations ? `
          <div>
            <div class="info-row"><strong>Recommendations:</strong></div>
            <div class="description-content">${reportData.recommendations}</div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Signatures -->
    ${reportData.customer_signature || reportData.technician_signature ? `
      <div class="signature-section">
        ${reportData.technician_signature ? `
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-status signed">✓ Technician Signed</div>
            </div>
            <div class="signature-label">Technician Signature</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${new Date(report.completed_at || report.updated_at).toLocaleDateString()}
            </div>
          </div>
        ` : ''}
        ${reportData.customer_signature ? `
          <div class="signature-block">
            <div class="signature-line">
              <div class="signature-status signed">✓ Customer Signed</div>
            </div>
            <div class="signature-label">Customer Signature</div>
            <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">
              ${new Date().toLocaleDateString()}
            </div>
          </div>
        ` : ''}
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">${companySettings?.company_name || 'PortaPro'} - Professional Service Solutions</div>
      <div>This report was generated automatically by our service management system</div>
      <div style="margin-top: 8px;">For questions about this service, please contact us</div>
      ${companySettings?.company_address ? `<div style="margin-top: 8px;">${companySettings.company_address}</div>` : ''}
    </div>
  </div>
</body>
</html>
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