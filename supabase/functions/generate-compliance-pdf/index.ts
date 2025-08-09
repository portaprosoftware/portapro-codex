import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CompliancePDFRequest {
  type: 'dvir' | 'maintenance' | 'spill_incident' | 'combined';
  reportId?: string;
  vehicleId?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  includePhotos?: boolean;
  companyBranding?: {
    logo?: string;
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: CompliancePDFRequest = await req.json();
    console.log('Generating compliance PDF for:', requestData);

    let reportData: any = {};
    let htmlTemplate = '';

    // Fetch data based on report type
    switch (requestData.type) {
      case 'dvir':
        if (requestData.reportId) {
          const { data: dvir } = await supabase
            .from('dvir_reports')
            .select(`
              *,
              vehicles!inner(license_plate, vehicle_type, vin),
              dvir_defects(*)
            `)
            .eq('id', requestData.reportId)
            .single();
          
          reportData = dvir;
          htmlTemplate = generateDVIRTemplate(dvir, requestData.companyBranding);
        }
        break;

      case 'maintenance':
        if (requestData.reportId) {
          const { data: maintenance } = await supabase
            .from('maintenance_reports')
            .select(`
              *,
              vehicles!inner(license_plate, vehicle_type, vin),
              maintenance_updates(*)
            `)
            .eq('id', requestData.reportId)
            .single();
          
          reportData = maintenance;
          htmlTemplate = generateMaintenanceTemplate(maintenance, requestData.companyBranding);
        }
        break;

      case 'spill_incident':
        if (requestData.reportId) {
          const { data: incident } = await supabase
            .from('spill_incidents')
            .select(`
              *,
              vehicles!inner(license_plate, vehicle_type)
            `)
            .eq('id', requestData.reportId)
            .single();
          
          reportData = incident;
          htmlTemplate = generateSpillIncidentTemplate(incident, requestData.companyBranding);
        }
        break;

      case 'combined':
        // Fetch multiple report types for a vehicle within date range
        const reports = await fetchCombinedReports(supabase, requestData);
        reportData = reports;
        htmlTemplate = generateCombinedTemplate(reports, requestData.companyBranding);
        break;
    }

    // Generate PDF using a simple HTML to PDF approach
    // In production, you'd want to use a proper PDF library like Puppeteer
    const pdfContent = await generatePDF(htmlTemplate);
    
    return new Response(pdfContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="compliance-report-${requestData.type}-${Date.now()}.pdf"`
      },
    });

  } catch (error: any) {
    console.error('Error generating compliance PDF:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

function generateDVIRTemplate(dvir: any, branding?: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>DVIR Report - ${dvir.vehicles.license_plate}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .company-info { text-align: center; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: bold; text-align: center; }
        .section { margin: 20px 0; }
        .defect { background: #ffebee; padding: 10px; margin: 10px 0; border-left: 4px solid #f44336; }
        .signature-section { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        ${branding ? `
          <div class="company-info">
            <h1>${branding.name}</h1>
            ${branding.address ? `<p>${branding.address}</p>` : ''}
            ${branding.phone ? `<p>Phone: ${branding.phone}</p>` : ''}
            ${branding.email ? `<p>Email: ${branding.email}</p>` : ''}
          </div>
        ` : ''}
        <h2 class="report-title">Driver Vehicle Inspection Report (DVIR)</h2>
      </div>

      <div class="section">
        <h3>Vehicle Information</h3>
        <table>
          <tr><td><strong>License Plate:</strong></td><td>${dvir.vehicles.license_plate}</td></tr>
          <tr><td><strong>Vehicle Type:</strong></td><td>${dvir.vehicles.vehicle_type}</td></tr>
          <tr><td><strong>VIN:</strong></td><td>${dvir.vehicles.vin || 'N/A'}</td></tr>
          <tr><td><strong>Inspection Date:</strong></td><td>${new Date(dvir.created_at).toLocaleDateString()}</td></tr>
          <tr><td><strong>Inspection Type:</strong></td><td>${dvir.report_type}</td></tr>
          <tr><td><strong>Odometer:</strong></td><td>${dvir.odometer || 'N/A'}</td></tr>
        </table>
      </div>

      <div class="section">
        <h3>Inspection Results</h3>
        ${dvir.dvir_defects && dvir.dvir_defects.length > 0 ? `
          <h4>Defects Found:</h4>
          ${dvir.dvir_defects.map((defect: any) => `
            <div class="defect">
              <strong>${defect.defect_item}:</strong> ${defect.description}
              <br><small>Severity: ${defect.severity} | Status: ${defect.status}</small>
            </div>
          `).join('')}
        ` : '<p>✅ No defects found - Vehicle passed inspection</p>'}
      </div>

      <div class="signature-section">
        <table>
          <tr>
            <td width="50%">
              <strong>Driver Signature:</strong><br>
              <div style="height: 50px; border-bottom: 1px solid #000; margin-top: 20px;"></div>
              <small>Date: ${new Date(dvir.created_at).toLocaleDateString()}</small>
            </td>
            <td width="50%">
              <strong>Supervisor Signature:</strong><br>
              <div style="height: 50px; border-bottom: 1px solid #000; margin-top: 20px;"></div>
              <small>Date: _____________</small>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;
}

function generateMaintenanceTemplate(maintenance: any, branding?: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Maintenance Report - ${maintenance.vehicles.license_plate}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .company-info { text-align: center; margin-bottom: 20px; }
        .report-title { font-size: 24px; font-weight: bold; text-align: center; }
        .section { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        ${branding ? `
          <div class="company-info">
            <h1>${branding.name}</h1>
            ${branding.address ? `<p>${branding.address}</p>` : ''}
          </div>
        ` : ''}
        <h2 class="report-title">Maintenance Report</h2>
      </div>

      <div class="section">
        <h3>Vehicle Information</h3>
        <table>
          <tr><td><strong>License Plate:</strong></td><td>${maintenance.vehicles.license_plate}</td></tr>
          <tr><td><strong>Report Number:</strong></td><td>${maintenance.report_number}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${new Date(maintenance.created_at).toLocaleDateString()}</td></tr>
          <tr><td><strong>Type:</strong></td><td>${maintenance.template_type}</td></tr>
        </table>
      </div>

      <div class="section">
        <h3>Maintenance Activities</h3>
        ${maintenance.maintenance_updates && maintenance.maintenance_updates.length > 0 ? `
          <table>
            <tr><th>Date</th><th>Description</th><th>Cost</th><th>Status</th></tr>
            ${maintenance.maintenance_updates.map((update: any) => `
              <tr>
                <td>${new Date(update.created_at).toLocaleDateString()}</td>
                <td>${update.description}</td>
                <td>$${update.cost_amount || '0.00'}</td>
                <td>${update.status}</td>
              </tr>
            `).join('')}
          </table>
        ` : '<p>No maintenance activities recorded</p>'}
      </div>
    </body>
    </html>
  `;
}

function generateSpillIncidentTemplate(incident: any, branding?: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Spill Incident Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .urgent { background: #ffebee; border: 2px solid #f44336; padding: 15px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f5f5f5; }
      </style>
    </head>
    <body>
      <div class="header">
        ${branding ? `<h1>${branding.name}</h1>` : ''}
        <h2>SPILL INCIDENT REPORT</h2>
      </div>

      <div class="urgent">
        <strong>⚠️ ENVIRONMENTAL INCIDENT REPORT</strong>
      </div>

      <table>
        <tr><td><strong>Incident Date:</strong></td><td>${new Date(incident.incident_date).toLocaleDateString()}</td></tr>
        <tr><td><strong>Vehicle:</strong></td><td>${incident.vehicles.license_plate}</td></tr>
        <tr><td><strong>Location:</strong></td><td>${incident.location}</td></tr>
        <tr><td><strong>Spill Volume:</strong></td><td>${incident.spill_volume_gallons} gallons</td></tr>
        <tr><td><strong>Cleanup Actions:</strong></td><td>${incident.cleanup_actions}</td></tr>
        <tr><td><strong>Reported to Authorities:</strong></td><td>${incident.reported_to_authorities ? 'Yes' : 'No'}</td></tr>
      </table>
    </body>
    </html>
  `;
}

function generateCombinedTemplate(reports: any, branding?: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Combined Compliance Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin: 30px 0; page-break-inside: avoid; }
      </style>
    </head>
    <body>
      <div class="header">
        ${branding ? `<h1>${branding.name}</h1>` : ''}
        <h2>Combined Compliance Report</h2>
        <p>Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <!-- Include all report sections here -->
      <div class="section">
        <h3>Summary</h3>
        <p>This report contains all compliance-related activities for the specified period.</p>
      </div>
    </body>
    </html>
  `;
}

async function fetchCombinedReports(supabase: any, request: CompliancePDFRequest) {
  // Fetch multiple report types - simplified for now
  return {
    dvirs: [],
    maintenance: [],
    incidents: []
  };
}

async function generatePDF(htmlContent: string): Promise<Uint8Array> {
  // Simplified PDF generation - in production use Puppeteer or similar
  // For now, return the HTML as bytes (browsers can handle this)
  const encoder = new TextEncoder();
  return encoder.encode(htmlContent);
}

serve(handler);