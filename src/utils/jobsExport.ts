import { formatDateSafe } from '@/lib/dateUtils';

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