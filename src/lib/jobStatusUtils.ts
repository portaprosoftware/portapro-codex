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
  was_overdue?: boolean;
  is_priority?: boolean;
}

/**
 * Check if a job is overdue based on current date vs scheduled date
 * Jobs become overdue the day AFTER their scheduled date
 */
export const isJobOverdue = (job: Job): boolean => {
  // Use string-based comparison to avoid timezone issues
  const today = new Date().toISOString().split('T')[0]; // Format: '2025-08-02'
  const scheduledDate = job.scheduled_date; // Should be in format: '2025-08-02'
  
  // Job is overdue only if today's date string is AFTER scheduled date string
  return today > scheduledDate;
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
  if (job.status === 'assigned' || job.status === 'unassigned' || job.status === 'in-progress') {
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
  },
  priority: { 
    gradient: 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white', 
    label: 'Was Overdue',
    color: '#F59E0B'
  }
});

/**
 * Should a priority indicator be shown for this job?
 * True if the job was_overdue (rescheduled from overdue) but is not currently overdue,
 * OR if the job is manually marked as priority
 */
export const shouldShowPriorityIndicator = (job: Job): boolean => {
  return ((job.was_overdue === true) && !isJobOverdue(job)) || (job as any).is_priority === true;
};

/**
 * Get status info for a job (returns primary display status)
 */
export const getJobStatusInfo = (job: Job) => {
  const displayStatus = getDisplayStatus(job);
  const statusConfig = getJobStatusConfig();
  
  return statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.assigned;
};

/**
 * Get dual status info for jobs with priority and overdue handling
 * Jobs that were ever overdue show 2 badges: Priority/Overdue + Status
 */
export const getDualJobStatusInfo = (job: Job) => {
  const statusConfig = getJobStatusConfig();
  
  // If job is completed, only show completion status
  if (job.status === 'completed') {
    const displayStatus = getDisplayStatus(job);
    return {
      primary: statusConfig[displayStatus as keyof typeof statusConfig] || statusConfig.completed,
      secondary: null,
      priority: null
    };
  }
  
  // For non-completed jobs, check if currently overdue
  if ((job.status === 'assigned' || job.status === 'unassigned' || job.status === 'in-progress') && isJobOverdue(job)) {
    // Currently overdue: show "Overdue" + actual status (2 badges)
    return {
      primary: statusConfig.overdue,
      secondary: statusConfig[job.status as keyof typeof statusConfig] || statusConfig.assigned,
      priority: null
    };
  }
  
  // Check for priority indicator (was ever overdue but not currently overdue)
  const showPriority = shouldShowPriorityIndicator(job);
  if (showPriority) {
    // Was overdue but rescheduled: show "Priority" + actual status (2 badges)
    return {
      primary: statusConfig.priority,
      secondary: statusConfig[job.status as keyof typeof statusConfig] || statusConfig.assigned,
      priority: null
    };
  }
  
  // For regular jobs that were never overdue, show only normal status (1 badge)
  return {
    primary: statusConfig[job.status as keyof typeof statusConfig] || statusConfig.assigned,
    secondary: null,
    priority: null
  };
};