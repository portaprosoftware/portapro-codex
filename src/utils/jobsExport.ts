import { formatDateSafe } from '@/lib/dateUtils';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';

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
}

interface FilterContext {
  dateRange?: DateRange;
  searchTerm?: string;
  selectedDriver?: string;
  selectedJobType?: string;
  selectedStatus?: string;
  driverName?: string;
  presetName?: string;
  runBy?: string;
}

export const generatePDFContent = (
  jobs: Job[], 
  filterContext: FilterContext = {},
  totalCount: number = 0
) => {
  const timestamp = new Date().toLocaleString();
  const resultCount = jobs.length;
  
  // Build filter summary
  const filterSummary: string[] = [];
  
  if (filterContext.dateRange?.from && filterContext.dateRange?.to) {
    const fromDate = format(filterContext.dateRange.from, 'MMM d, yyyy');
    const toDate = format(filterContext.dateRange.to, 'MMM d, yyyy');
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

  // Status distribution
  const statusCounts = jobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    title: `Jobs Report${filterContext.presetName ? ` - ${filterContext.presetName}` : ''}`,
    timestamp,
    runBy: filterContext.runBy || 'Unknown User',
    filterSummary: filterSummary.length > 0 ? filterSummary : ['No filters applied'],
    resultsSummary: `Showing ${resultCount} of ${totalCount} total jobs`,
    statusDistribution: statusCounts,
    jobs: jobs.slice(0, 5), // First 5 jobs for preview
    hasMoreJobs: jobs.length > 5,
    remainingCount: Math.max(0, jobs.length - 5),
    shareUrl: window.location.href
  };
};

export const exportJobsToCSV = (jobs: Job[], filename: string = 'jobs-export') => {
  const headers = [
    'Job Number',
    'Scheduled Date',
    'Job Type',
    'Status',
    'Customer Name',
    'Customer Address',
    'Driver Name',
    'Vehicle',
    'Was Overdue',
    'Completed Date'
  ];

  const csvContent = [
    headers.join(','),
    ...jobs.map(job => [
      `"${job.job_number || ''}"`,
      `"${formatDateSafe(job.scheduled_date, 'long')}"`,
      `"${job.job_type?.replace('-', ' ') || ''}"`,
      `"${job.status?.replace('_', ' ') || ''}"`,
      `"${job.customers?.name || ''}"`,
      `"${[
        job.customers?.service_street,
        job.customers?.service_city,
        job.customers?.service_state
      ].filter(Boolean).join(', ')}"`,
      `"${job.profiles ? `${job.profiles.first_name || ''} ${job.profiles.last_name || ''}`.trim() : 'Unassigned'}"`,
      `"${job.vehicles?.license_plate || ''}"`,
      `"${job.was_overdue ? 'Yes' : 'No'}"`,
      `"${job.completed_at ? formatDateSafe(job.completed_at.split('T')[0], 'long') : ''}"`
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};