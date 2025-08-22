import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Job {
  id: string;
  job_number: string;
  scheduled_date: string;
  job_type: string;
  status: string;
  was_overdue?: boolean;
  completed_at?: string;
  driver_id?: string;
  customers?: {
    id: string;
    name: string;
    service_street?: string;
    service_city?: string;
    service_state?: string;
    service_zip?: string;
  };
  profiles?: {
    id: string;
    first_name?: string;
    last_name?: string;
  };
  vehicles?: {
    id: string;
    license_plate?: string;
    vehicle_type?: string;
  };
  customer_service_locations?: {
    gps_coordinates?: { x: number; y: number };
  };
}

interface FilterContext {
  dateRange?: any;
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  driverName?: string;
  presetName?: string;
  runBy?: string;
}

interface PDFRequest {
  jobs: Job[];
  filterContext: FilterContext;
  totalCount: number;
  userEmail?: string;
}

// Simple PDF generation function using HTML to PDF conversion
async function generatePDFFromHTML(htmlContent: string): Promise<Uint8Array> {
  try {
    // Use a simple PDF generation service or library
    // For now, we'll use a browser automation approach via API
    const htmlToPdfApiUrl = 'https://api.htmltopdf.app/v1/generate';
    
    const response = await fetch(htmlToPdfApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': Deno.env.get('HTML_TO_PDF_API_KEY') || 'demo-key'
      },
      body: JSON.stringify({
        html: htmlContent,
        format: 'A4',
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        },
        printBackground: true,
        landscape: false
      })
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const pdfBuffer = await response.arrayBuffer();
    return new Uint8Array(pdfBuffer);
  } catch (error) {
    console.error('PDF generation error:', error);
    // Fallback: return null to indicate PDF generation failed
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { jobs, filterContext, totalCount, userEmail }: PDFRequest = await req.json();

    console.log(`Generating enhanced PDF for ${jobs.length} jobs with filter context:`, filterContext);

    // Generate status distribution for sparkline
    const statusCounts = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Extract unique locations for mini-map
    const locations = jobs
      .filter(job => job.customer_service_locations?.gps_coordinates)
      .map(job => ({
        lat: job.customer_service_locations!.gps_coordinates!.y,
        lng: job.customer_service_locations!.gps_coordinates!.x,
        jobNumber: job.job_number,
        customer: job.customers?.name || 'Unknown'
      }));

    // Generate mini-map image URL if we have locations and Mapbox token
    let mapImageUrl = null;
    if (locations.length > 0 && mapboxToken) {
      const bounds = calculateBounds(locations);
      const markers = locations.slice(0, 20).map(loc => 
        `pin-s-${loc.jobNumber.slice(-1)}+ff0000(${loc.lng},${loc.lat})`
      ).join(',');
      
      mapImageUrl = `https://api.mapbox.com/styles/v1/mapbox/light-v11/static/${markers}/${bounds.center.lng},${bounds.center.lat},${bounds.zoom}/400x300@2x?access_token=${mapboxToken}`;
    }

    // Build filter summary
    const filterSummary: string[] = [];
    
    if (filterContext.dateRange?.from && filterContext.dateRange?.to) {
      const fromDate = new Date(filterContext.dateRange.from).toLocaleDateString();
      const toDate = new Date(filterContext.dateRange.to).toLocaleDateString();
      filterSummary.push(`Date Range: ${fromDate} - ${toDate}`);
    }
    
    if (filterContext.searchTerm) {
      filterSummary.push(`Search: "${filterContext.searchTerm}"`);
    }
    
    if (filterContext.driverName && filterContext.selectedDriver !== 'all') {
      filterSummary.push(`Driver: ${filterContext.driverName}`);
    }
    
    if (filterContext.selectedJobType && filterContext.selectedJobType !== 'all') {
      filterSummary.push(`Job Type: ${filterContext.selectedJobType.replace('-', ' ')}`);
    }
    
    if (filterContext.selectedStatus && filterContext.selectedStatus !== 'all') {
      filterSummary.push(`Status: ${filterContext.selectedStatus.replace('_', ' ')}`);
    }

    // Generate sparkline SVG for status distribution
    const sparklineSvg = generateSparklineSvg(statusCounts);

    // Create HTML template for PDF
    const htmlContent = generatePDFHTML({
      title: `Jobs Report${filterContext.presetName ? ` - ${filterContext.presetName}` : ''}`,
      timestamp: new Date().toLocaleString(),
      runBy: filterContext.runBy || userEmail || 'Unknown User',
      filterSummary: filterSummary.length > 0 ? filterSummary : ['No filters applied'],
      resultsSummary: `Showing ${jobs.length} of ${totalCount} total jobs`,
      statusDistribution: statusCounts,
      sparklineSvg,
      mapImageUrl,
      jobs: jobs.slice(0, 20), // Show more jobs in PDF
      hasMoreJobs: jobs.length > 20,
      remainingCount: Math.max(0, jobs.length - 20),
      shareUrl: `${supabaseUrl.replace('supabase.co', 'supabase.app')}/jobs/custom?preset=${filterContext.presetName || 'shared'}`,
      locations
    });

    // Try to generate actual PDF
    try {
      const pdfBuffer = await generatePDFFromHTML(htmlContent);
      
      // Return PDF as base64 for download
      const base64Pdf = btoa(String.fromCharCode(...pdfBuffer));
      
      const response = {
        success: true,
        pdfData: base64Pdf,
        contentType: 'application/pdf',
        filename: `jobs-report-${new Date().toISOString().split('T')[0]}.pdf`,
        metadata: {
          jobCount: jobs.length,
          totalCount,
          timestamp: new Date().toISOString(),
          filterContext,
          hasMap: !!mapImageUrl,
          locationCount: locations.length
        }
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } catch (pdfError) {
      console.error('PDF generation failed, falling back to HTML:', pdfError);
      
      // Fallback to HTML if PDF generation fails
      const response = {
        success: true,
        htmlContent,
        fallbackToHtml: true,
        error: 'PDF generation service unavailable, providing HTML fallback',
        metadata: {
          jobCount: jobs.length,
          totalCount,
          timestamp: new Date().toISOString(),
          filterContext,
          hasMap: !!mapImageUrl,
          locationCount: locations.length
        }
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

  } catch (error) {
    console.error('Error generating enhanced PDF:', error);
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

function calculateBounds(locations: Array<{lat: number, lng: number}>) {
  if (locations.length === 0) {
    return { center: { lat: 40.7128, lng: -74.0060 }, zoom: 10 };
  }

  const lats = locations.map(l => l.lat);
  const lngs = locations.map(l => l.lng);
  
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  
  // Calculate zoom based on bounds
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const maxDiff = Math.max(latDiff, lngDiff);
  
  let zoom = 10;
  if (maxDiff < 0.01) zoom = 14;
  else if (maxDiff < 0.05) zoom = 12;
  else if (maxDiff < 0.1) zoom = 11;
  else if (maxDiff < 0.5) zoom = 9;
  else if (maxDiff < 1) zoom = 8;
  else zoom = 7;
  
  return {
    center: { lat: centerLat, lng: centerLng },
    zoom
  };
}

function generateSparklineSvg(statusCounts: Record<string, number>): string {
  const statusOrder = ['unassigned', 'assigned', 'in_progress', 'completed', 'cancelled', 'overdue'];
  const colors = {
    unassigned: '#94a3b8',
    assigned: '#3b82f6', 
    in_progress: '#eab308',
    completed: '#22c55e',
    cancelled: '#ef4444',
    overdue: '#dc2626'
  };
  
  const values = statusOrder.map(status => statusCounts[status] || 0);
  const maxValue = Math.max(...values, 1);
  const width = 200;
  const height = 40;
  
  const barWidth = width / values.length;
  
  let bars = '';
  values.forEach((value, index) => {
    const barHeight = (value / maxValue) * height;
    const x = index * barWidth;
    const y = height - barHeight;
    const status = statusOrder[index];
    
    bars += `<rect x="${x + 2}" y="${y}" width="${barWidth - 4}" height="${barHeight}" fill="${colors[status as keyof typeof colors] || '#94a3b8'}" />`;
  });
  
  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${bars}</svg>`;
}

function generatePDFHTML(data: any): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    @page { margin: 1cm; size: A4; }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      margin: 0; 
      padding: 0; 
      font-size: 11px; 
      line-height: 1.5; 
      color: #1f2937;
      background: #ffffff;
    }
    
    .document-container {
      max-width: 100%;
      padding: 20px;
    }
    
    .header {
      border-bottom: 3px solid;
      border-image: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%)) 1;
      padding-bottom: 20px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    
    .header-left .title { 
      font-size: 24px; 
      font-weight: 700; 
      margin-bottom: 8px; 
      color: #1f2937;
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .header-right {
      text-align: right;
      font-size: 10px;
      color: #6b7280;
    }
    
    .metadata { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 8px; 
      color: #6b7280; 
      font-size: 10px; 
    }
    
    .company-brand {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 4px;
    }
    
    .filter-summary { 
      background: linear-gradient(135deg, #f8fafc, #f1f5f9); 
      padding: 16px; 
      border-radius: 12px; 
      margin-bottom: 20px;
      border-left: 4px solid hsl(214, 83%, 56%);
    }
    
    .filter-summary h3 { 
      margin: 0 0 12px 0; 
      font-size: 14px; 
      color: #1f2937; 
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .filter-tags { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 8px; 
    }
    
    .filter-tag { 
      background: linear-gradient(135deg, hsl(214, 83%, 56%), hsl(195, 84%, 65%));
      color: white;
      padding: 4px 12px; 
      border-radius: 20px; 
      font-size: 10px;
      font-weight: 500;
    }
    
    .analytics { 
      display: flex; 
      gap: 20px; 
      margin-bottom: 20px; 
    }
    
    .analytics-item { 
      flex: 1;
      background: #f9fafb;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    
    .analytics-item h4 { 
      margin: 0 0 8px 0; 
      font-size: 13px; 
      color: #1f2937;
      font-weight: 600;
    }
    
    .sparkline { 
      margin: 10px 0; 
    }
    
    .map-section { 
      margin: 12px 0; 
    }
    
    .map-section img { 
      max-width: 100%; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .jobs-table { 
      width: 100%; 
      border-collapse: collapse; 
      margin: 20px 0; 
      font-size: 10px;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .jobs-table th, .jobs-table td { 
      padding: 8px 6px; 
      text-align: left; 
      border-bottom: 1px solid #f3f4f6; 
    }
    
    .jobs-table th { 
      background: linear-gradient(135deg, #f8fafc, #f1f5f9);
      font-weight: 600; 
      font-size: 10px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .jobs-table tbody tr:nth-child(even) {
      background: #fafbfc;
    }
    
    .status-badge { 
      padding: 3px 8px; 
      border-radius: 12px; 
      font-size: 8px; 
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-completed { 
      background: #dcfce7; 
      color: #166534; 
      border: 1px solid #22c55e;
    }
    
    .status-in_progress { 
      background: #fef3c7; 
      color: #92400e;
      border: 1px solid #f59e0b;
    }
    
    .status-assigned { 
      background: #dbeafe; 
      color: #1e40af;
      border: 1px solid #3b82f6;
    }
    
    .status-overdue { 
      background: #fecaca; 
      color: #991b1b;
      border: 1px solid #ef4444;
    }
    
    .status-unassigned { 
      background: #f3f4f6; 
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .footer { 
      margin-top: 30px; 
      padding-top: 20px; 
      border-top: 2px solid #e5e7eb; 
      font-size: 10px; 
      color: #6b7280;
      text-align: center;
    }
    
    .footer-brand {
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .more-jobs { 
      background: linear-gradient(135deg, #f0f9ff, #e0f2fe); 
      padding: 16px; 
      border-radius: 12px; 
      text-align: center; 
      margin: 20px 0;
      border-left: 4px solid hsl(195, 84%, 65%);
    }
    
    .deep-link { 
      color: hsl(214, 83%, 56%); 
      text-decoration: none; 
      font-size: 10px;
      font-weight: 500;
    }
    
    .location-count { 
      font-size: 9px; 
      color: #6b7280; 
      margin-top: 6px; 
    }
    
    .compact-row td { 
      padding: 6px; 
      vertical-align: middle;
    }
    
    .stats-grid {
      display: flex;
      gap: 12px;
      margin-top: 8px;
      font-size: 9px;
      color: #6b7280;
    }
    
    .stat-item {
      flex: 1;
      text-align: center;
    }
    
    .stat-value {
      font-weight: 600;
      color: #1f2937;
      display: block;
      margin-bottom: 2px;
    }
    
    @media print {
      .document-container { padding: 15px; }
      .page-break { page-break-before: always; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    <div class="header">
      <div class="header-left">
        <div class="title">📊 ${data.title}</div>
        <div class="company-brand">PortaPro Advanced Analytics</div>
      </div>
      <div class="header-right">
        <div><strong>Generated:</strong> ${data.timestamp}</div>
        <div><strong>Run by:</strong> ${data.runBy}</div>
        <div style="margin-top: 8px;"><strong>${data.resultsSummary}</strong></div>
      </div>
    </div>

    <div class="filter-summary">
      <h3>🔍 Applied Filters</h3>
      <div class="filter-tags">
        ${data.filterSummary.map((filter: string) => `<span class="filter-tag">${filter}</span>`).join('')}
      </div>
    </div>

    <div class="analytics">
      <div class="analytics-item">
        <h4>📈 Status Distribution</h4>
        <div class="sparkline">${data.sparklineSvg}</div>
        <div class="stats-grid">
          ${Object.entries(data.statusDistribution).map(([status, count]) => 
            `<div class="stat-item">
              <span class="stat-value">${count}</span>
              <span>${status.replace('_', ' ')}</span>
            </div>`
          ).join('')}
        </div>
      </div>
      ${data.mapImageUrl ? `
      <div class="analytics-item">
        <h4>🗺️ Locations Overview</h4>
        <div class="map-section">
          <img src="${data.mapImageUrl}" alt="Job locations map" style="max-height: 140px;" />
          <div class="location-count">${data.locations.length} unique service locations</div>
        </div>
      </div>
      ` : ''}
    </div>

    <table class="jobs-table">
      <thead>
        <tr>
          <th style="width: 15%;">Job Number</th>
          <th style="width: 12%;">Scheduled Date</th>
          <th style="width: 15%;">Job Type</th>
          <th style="width: 12%;">Status</th>
          <th style="width: 25%;">Customer</th>
          <th style="width: 21%;">Assigned Driver</th>
        </tr>
      </thead>
      <tbody>
        ${data.jobs.map((job: Job) => `
          <tr class="compact-row">
            <td style="font-weight: 600; color: hsl(214, 83%, 56%);">${job.job_number}</td>
            <td>${new Date(job.scheduled_date).toLocaleDateString()}</td>
            <td style="text-transform: capitalize;">${job.job_type.replace('-', ' ')}</td>
            <td><span class="status-badge status-${job.status}">${job.status.replace('_', ' ')}</span></td>
            <td style="font-weight: 500;">${job.customers?.name || 'N/A'}</td>
            <td>${job.profiles ? `${job.profiles.first_name || ''} ${job.profiles.last_name || ''}`.trim() : 'Unassigned'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    ${data.hasMoreJobs ? `
    <div class="more-jobs">
      <div style="font-weight: 600; color: #1f2937; margin-bottom: 8px;">
        📋 Additional Results Available
      </div>
      <div><strong>+${data.remainingCount} additional jobs</strong> match your current filters</div>
      <div style="font-size: 9px; margin-top: 8px; color: #6b7280;">
        This report shows the first 20 results. Use the link below to view all matching jobs in the application.
      </div>
    </div>
    ` : ''}

    <div class="footer">
      <div class="footer-brand">PortaPro Professional Services Management</div>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
        <span>Report generated on ${data.timestamp}</span>
        <a href="${data.shareUrl}" class="deep-link">🔗 View complete results in PortaPro Dashboard</a>
      </div>
      <div style="margin-top: 8px; font-size: 9px;">
        Advanced Search & Analytics • Professional PDF Export
      </div>
    </div>
  </div>
</body>
</html>
  `;
}