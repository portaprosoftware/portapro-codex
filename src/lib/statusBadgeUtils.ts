// Centralized utility for getting status badge variants
import { JobStatus } from '@/types';

export type StatusBadgeVariant = 
  | 'pending' 
  | 'assigned' 
  | 'unassigned' 
  | 'in-progress' 
  | 'completed' 
  | 'cancelled'
  | 'priority'
  | 'overdue'
  | 'was_overdue'
  | 'completed_late'
  | 'draft'
  | 'active'
  | 'inactive';

/**
 * Get the standardized badge variant for any job status
 * This replaces all scattered getStatusColor functions across the app
 */
export function getStatusBadgeVariant(
  status: JobStatus | 'all' | 'priority' | 'was_overdue' | 'overdue' | 'completed_late'
): StatusBadgeVariant {
  switch (status) {
    case 'pending':
      return 'pending';
    case 'assigned':
      return 'assigned';
    case 'unassigned':
      return 'unassigned';
    case 'in-progress':
      return 'in-progress';
    case 'completed':
      return 'completed';
    case 'cancelled':
      return 'cancelled';
    case 'priority':
      return 'priority';
    case 'overdue':
      return 'overdue';
    case 'was_overdue':
      return 'was_overdue';
    case 'completed_late':
      return 'completed_late';
    default:
      return 'pending'; // fallback
  }
}

/**
 * Get badge variant for quote statuses
 */
export function getQuoteStatusBadgeVariant(
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
): StatusBadgeVariant {
  switch (status) {
    case 'draft':
      return 'draft';
    case 'sent':
      return 'assigned';
    case 'accepted':
      return 'completed';
    case 'rejected':
      return 'cancelled';
    case 'expired':
      return 'overdue';
    default:
      return 'draft'; // fallback
  }
}

/**
 * Get badge variant for general states
 */
export function getStateBadgeVariant(state: 'active' | 'inactive' | 'draft'): StatusBadgeVariant {
  return state;
}