/**
 * Unified job status utilities for consistent overdue and completion handling
 * across all job views (calendar, dispatch, map)
 */

export interface Job {
  id: string;
  status: string;
  scheduled_date: string;
  scheduled_time?: string;
  actual_completion_time?: string;
}

/**
 * Check if a job is overdue based on current date vs scheduled date
 */
export const isJobOverdue = (job: Job): boolean => {
  const currentDate = new Date();
  const scheduledDate = new Date(job.scheduled_date);
  
  // Set time to end of scheduled day for comparison
  scheduledDate.setHours(23, 59, 59, 999);
  
  return scheduledDate < currentDate;
};

/**
 * Check if a completed job was completed late
 */
export const isJobCompletedLate = (job: Job): boolean => {
  if (job.status !== 'completed' || !job.actual_completion_time) {
    return false;
  }
  
  const scheduledDate = new Date(job.scheduled_date);
  const completionTime = new Date(job.actual_completion_time);
  
  // Set scheduled date to end of day for comparison
  scheduledDate.setHours(23, 59, 59, 999);
  
  return completionTime > scheduledDate;
};

/**
 * Get the display status for a job, handling overdue and completed late logic
 */
export const getDisplayStatus = (job: Job): string => {
  // If job is completed, check if it was completed late
  if (job.status === 'completed') {
    return isJobCompletedLate(job) ? 'completed_late' : 'completed';
  }
  
  // For non-completed jobs (assigned, unassigned, in-progress), check if overdue
  if (job.status === 'assigned' || job.status === 'unassigned' || job.status === 'in-progress' || job.status === 'in_progress') {
    return isJobOverdue(job) ? 'overdue' : job.status;
  }
  
  // For cancelled jobs, return as-is
  return job.status;
};

/**
 * Status configuration for consistent styling across all components
 */
export const getJobStatusConfig = () => ({
  assigned: { 
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', 
    label: 'Assigned',
    color: '#3B82F6'
  },
  unassigned: { 
    gradient: 'bg-gradient-to-r from-gray-400 to-gray-500 text-white', 
    label: 'Unassigned',
    color: '#9CA3AF'
  },
  in_progress: { 
    gradient: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white', 
    label: 'In Progress',
    color: '#F97316'
  },
  'in-progress': { 
    gradient: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white', 
    label: 'In Progress',
    color: '#F97316'
  },
  completed: { 
    gradient: 'bg-gradient-to-r from-green-500 to-green-600 text-white', 
    label: 'Completed',
    color: '#10B981'
  },
  completed_late: { 
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
    label: 'Job Completed Late',
    color: '#6B7280'
  },
  overdue: { 
    gradient: 'bg-gradient-to-r from-red-500 to-red-600 text-white', 
    label: 'Overdue',
    color: '#EF4444'
  },
  cancelled: { 
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
    label: 'Cancelled',
    color: '#6B7280'
  }
});

/**
 * Get status info for a job (returns primary display status)
 */
export const getJobStatusInfo = (job: Job) => {
  const displayStatus = getDisplayStatus(job);
  const statusConfig = getJobStatusConfig();
  
  return statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.assigned;
};

/**
 * Get dual status info for overdue jobs (returns both overdue and original status)
 */
export const getDualJobStatusInfo = (job: Job) => {
  const statusConfig = getJobStatusConfig();
  
  // If job is completed, only show completion status
  if (job.status === 'completed') {
    const displayStatus = getDisplayStatus(job);
    return {
      primary: statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.completed,
      secondary: null
    };
  }
  
  // For non-completed jobs, check if overdue
  if ((job.status === 'assigned' || job.status === 'unassigned' || job.status === 'in-progress' || job.status === 'in_progress') && isJobOverdue(job)) {
    return {
      primary: statusConfig.overdue,
      secondary: statusConfig[job.status as keyof typeof statusConfig] || statusConfig.assigned
    };
  }
  
  // For cancelled or regular jobs, only show single status
  const displayStatus = getDisplayStatus(job);
  return {
    primary: statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.assigned,
    secondary: null
  };
};