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
  
  // For non-completed jobs (assigned, in-progress, unassigned), check if overdue
  if (job.status === 'assigned' || job.status === 'in-progress' || job.status === 'in_progress' || job.status === 'unassigned') {
    return isJobOverdue(job) ? 'overdue' : job.status;
  }
  
  // For cancelled jobs, return as-is
  return job.status;
};

/**
 * Status configuration for consistent styling across all components
 */
export const getJobStatusConfig = () => ({
  unassigned: { 
    gradient: 'bg-gradient-purple text-white font-bold', 
    label: 'Unassigned',
    color: '#9333EA',
    variant: 'unassigned' as const
  },
  assigned: { 
    gradient: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white', 
    label: 'Assigned',
    color: '#3B82F6',
    variant: 'info' as const
  },
  in_progress: { 
    gradient: 'bg-gradient-yellow text-white font-bold', 
    label: 'In Progress',
    color: '#EAB308',
    variant: 'inProgress' as const
  },
  'in-progress': { 
    gradient: 'bg-gradient-yellow text-white font-bold', 
    label: 'In Progress',
    color: '#EAB308',
    variant: 'inProgress' as const
  },
  completed: { 
    gradient: 'bg-gradient-to-r from-green-500 to-green-600 text-white', 
    label: 'Completed',
    color: '#10B981',
    variant: 'success' as const
  },
  completed_late: { 
    gradient: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white', 
    label: 'Job Completed Late',
    color: '#6B7280',
    variant: 'secondary' as const
  },
  overdue: { 
    gradient: 'bg-gradient-to-r from-red-500 to-red-600 text-white', 
    label: 'Overdue',
    color: '#EF4444',
    variant: 'destructive' as const
  },
  cancelled: { 
    gradient: 'bg-gradient-black text-white font-bold', 
    label: 'Cancelled',
    color: '#374151',
    variant: 'cancelled' as const
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
  if ((job.status === 'assigned' || job.status === 'in-progress' || job.status === 'in_progress' || job.status === 'unassigned') && isJobOverdue(job)) {
    return {
      primary: statusConfig.overdue,
      secondary: statusConfig[job.status as keyof typeof statusConfig] || statusConfig.unassigned
    };
  }
  
  // For cancelled or regular jobs, only show single status
  const displayStatus = getDisplayStatus(job);
  return {
    primary: statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.assigned,
    secondary: null
  };
};