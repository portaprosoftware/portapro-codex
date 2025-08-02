import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.0';

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
      jobs: jobs.slice(0, 5), // First 5 jobs for detailed view
      hasMoreJobs: jobs.length > 5,
      remainingCount: Math.max(0, jobs.length - 5),
      shareUrl: `${supabaseUrl.replace('supabase.co', 'supabase.app')}/jobs/custom?preset=${filterContext.presetName || 'shared'}`,
      locations
    });

    // Convert HTML to PDF using Puppeteer or similar service
    // For now, we'll return the HTML content that can be converted client-side
    const response = {
      success: true,
      htmlContent,
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
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 20px; font-size: 12px; }
    .header { border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 20px; }
    .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
    .metadata { display: flex; justify-content: space-between; margin-bottom: 15px; color: #6b7280; }
    .filter-summary { background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
    .filter-summary h3 { margin: 0 0 10px 0; font-size: 14px; }
    .filter-tags { display: flex; flex-wrap: wrap; gap: 8px; }
    .filter-tag { background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 11px; }
    .analytics { display: flex; gap: 20px; margin-bottom: 20px; }
    .analytics-item { flex: 1; }
    .analytics-item h4 { margin: 0 0 8px 0; font-size: 12px; color: #6b7280; }
    .sparkline { margin: 10px 0; }
    .map-section { margin: 20px 0; }
    .map-section img { max-width: 100%; border-radius: 8px; border: 1px solid #e5e7eb; }
    .jobs-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    .jobs-table th, .jobs-table td { padding: 8px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .jobs-table th { background: #f9fafb; font-weight: 600; }
    .status-badge { padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 500; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-in_progress { background: #fef3c7; color: #92400e; }
    .status-assigned { background: #dbeafe; color: #1e40af; }
    .status-overdue { background: #fecaca; color: #991b1b; }
    .status-unassigned { background: #f3f4f6; color: #374151; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #6b7280; }
    .page-break { page-break-before: always; }
    .more-jobs { background: #f0f9ff; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0; }
    .deep-link { color: #2563eb; text-decoration: none; }
    .deep-link:hover { text-decoration: underline; }
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
    <h3>Filter Summary</h3>
    <div class="filter-tags">
      ${data.filterSummary.map((filter: string) => `<span class="filter-tag">${filter}</span>`).join('')}
    </div>
  </div>

  <div class="analytics">
    <div class="analytics-item">
      <h4>Status Distribution</h4>
      <div class="sparkline">${data.sparklineSvg}</div>
      <div style="font-size: 10px; color: #6b7280;">
        ${Object.entries(data.statusDistribution).map(([status, count]) => 
          `${status.replace('_', ' ')}: ${count}`
        ).join(' • ')}
      </div>
    </div>
    ${data.mapImageUrl ? `
    <div class="analytics-item">
      <h4>Location Overview (${data.locations.length} locations)</h4>
      <div class="map-section">
        <img src="${data.mapImageUrl}" alt="Job locations map" />
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
        <tr>
          <td>${job.job_number}</td>
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
    <strong>+${data.remainingCount} more jobs...</strong><br>
    <small>This preview shows the first 5 jobs. View complete results in the app.</small>
  </div>
  ` : ''}

  <div class="footer">
    <div style="display: flex; justify-content: space-between;">
      <span>Filtered on ${data.timestamp}</span>
      <span>
        <a href="${data.shareUrl}" class="deep-link">📱 View Live in App</a>
      </span>
    </div>
    <div style="margin-top: 10px; text-align: center;">
      Generated by PortaPro Advanced Search • Page 1
    </div>
  </div>
</body>
</html>
  `;
}