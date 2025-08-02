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
    @page { margin: 1cm; size: A4; }
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 0; font-size: 11px; line-height: 1.4; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 15px; margin-bottom: 15px; }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 8px; color: #1f2937; }
    .metadata { display: flex; justify-content: space-between; margin-bottom: 10px; color: #6b7280; font-size: 10px; }
    .filter-summary { background: #f9fafb; padding: 12px; border-radius: 6px; margin-bottom: 15px; }
    .filter-summary h3 { margin: 0 0 8px 0; font-size: 12px; color: #374151; }
    .filter-tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .filter-tag { background: #e5e7eb; padding: 3px 6px; border-radius: 3px; font-size: 9px; }
    .analytics { display: flex; gap: 15px; margin-bottom: 15px; }
    .analytics-item { flex: 1; }
    .analytics-item h4 { margin: 0 0 6px 0; font-size: 11px; color: #6b7280; }
    .sparkline { margin: 8px 0; }
    .map-section { margin: 15px 0; }
    .map-section img { max-width: 100%; border-radius: 6px; border: 1px solid #e5e7eb; }
    .jobs-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 10px; }
    .jobs-table th, .jobs-table td { padding: 6px 4px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .jobs-table th { background: #f9fafb; font-weight: 600; font-size: 9px; }
    .status-badge { padding: 2px 5px; border-radius: 3px; font-size: 8px; font-weight: 500; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-in_progress { background: #fef3c7; color: #92400e; }
    .status-assigned { background: #dbeafe; color: #1e40af; }
    .status-overdue { background: #fecaca; color: #991b1b; }
    .status-unassigned { background: #f3f4f6; color: #374151; }
    .footer { margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 9px; color: #6b7280; }
    .page-break { page-break-before: always; }
    .more-jobs { background: #f0f9ff; padding: 12px; border-radius: 6px; text-align: center; margin: 15px 0; }
    .deep-link { color: #2563eb; text-decoration: none; font-size: 9px; }
    .location-count { font-size: 9px; color: #6b7280; margin-top: 4px; }
    .compact-row td { padding: 4px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${data.title}</div>
    <div class="metadata">
      <span>Generated: ${data.timestamp}</span>
      <span>Run by: ${data.runBy}</span>
    </div>
    <div class="metadata">
      <span>${data.resultsSummary}</span>
      <span>Page 1 of 1</span>
    </div>
  </div>

  <div class="filter-summary">
    <h3>Applied Filters</h3>
    <div class="filter-tags">
      ${data.filterSummary.map((filter: string) => `<span class="filter-tag">${filter}</span>`).join('')}
    </div>
  </div>

  <div class="analytics">
    <div class="analytics-item">
      <h4>Status Distribution</h4>
      <div class="sparkline">${data.sparklineSvg}</div>
      <div style="font-size: 9px; color: #6b7280; margin-top: 4px;">
        ${Object.entries(data.statusDistribution).map(([status, count]) => 
          `${status.replace('_', ' ')}: ${count}`
        ).join(' • ')}
      </div>
    </div>
    ${data.mapImageUrl ? `
    <div class="analytics-item">
      <h4>Locations Map</h4>
      <div class="map-section">
        <img src="${data.mapImageUrl}" alt="Job locations map" style="max-height: 120px;" />
        <div class="location-count">${data.locations.length} unique locations</div>
      </div>
    </div>
    ` : ''}
  </div>

  <table class="jobs-table">
    <thead>
      <tr>
        <th>Job #</th>
        <th>Date</th>
        <th>Type</th>
        <th>Status</th>
        <th>Customer</th>
        <th>Driver</th>
      </tr>
    </thead>
    <tbody>
      ${data.jobs.map((job: Job) => `
        <tr class="compact-row">
          <td style="font-weight: 600;">${job.job_number}</td>
          <td>${new Date(job.scheduled_date).toLocaleDateString()}</td>
          <td>${job.job_type.replace('-', ' ')}</td>
          <td><span class="status-badge status-${job.status}">${job.status.replace('_', ' ')}</span></td>
          <td>${job.customers?.name || 'N/A'}</td>
          <td>${job.profiles ? `${job.profiles.first_name || ''} ${job.profiles.last_name || ''}`.trim() : 'Unassigned'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  ${data.hasMoreJobs ? `
  <div class="more-jobs">
    <strong>+${data.remainingCount} additional jobs match your filters</strong><br>
    <small style="font-size: 9px;">Showing first 20 jobs. Use the app link below to view all results.</small>
  </div>
  ` : ''}

  <div class="footer">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span>Report generated on ${data.timestamp}</span>
      <span>
        <a href="${data.shareUrl}" class="deep-link">🔗 View complete results in PortaPro</a>
      </span>
    </div>
    <div style="margin-top: 8px; text-align: center;">
      PortaPro Advanced Search • Enhanced PDF Report
    </div>
  </div>
</body>
</html>
  `;
}