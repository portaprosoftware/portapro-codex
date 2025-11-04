import { Permissions } from '../types';
import { AppRole } from '@/hooks/useUserRole';

export type ReportStatus = 'draft' | 'submitted' | 'sent_to_customer' | 'completed' | 'voided';

interface CanEditFieldParams {
  fieldId: string;
  userRole: AppRole;
  permissions: Permissions;
  reportStatus: ReportStatus;
}

/**
 * Determines if a user can edit a specific field based on their role, 
 * field permissions, and the current report status
 */
export function canEditField({
  fieldId,
  userRole,
  permissions,
  reportStatus,
}: CanEditFieldParams): boolean {
  // Admin-level users (owner, dispatcher, admin) have full access
  const isAdminLevel = userRole === 'org:owner' || userRole === 'org:dispatcher' || userRole === 'org:admin';
  
  if (isAdminLevel) {
    return true;
  }

  // Check report stage locks for non-admin users
  if (reportStatus === 'submitted' && permissions.stage_permissions.lock_after_submit) {
    return false;
  }

  if (reportStatus === 'sent_to_customer' && permissions.stage_permissions.lock_after_customer_send) {
    return false;
  }

  if (reportStatus === 'voided' || reportStatus === 'completed') {
    return false;
  }

  // Check role-based field permissions for drivers
  if (userRole === 'org:driver') {
    const techFields = permissions.tech_editable_fields;
    
    // Empty array or ['*'] means all fields are editable
    if (techFields.length === 0 || techFields.includes('*')) {
      return true;
    }
    
    return techFields.includes(fieldId);
  }

  // Unknown/viewer role - deny access
  return false;
}

interface CanEditFeeParams {
  userRole: AppRole;
  permissions: Permissions;
  reportStatus: ReportStatus;
  action: 'view' | 'add_remove' | 'edit_amount' | 'add_custom';
}

/**
 * Determines if a user can perform fee-related actions
 */
export function canEditFee({
  userRole,
  permissions,
  reportStatus,
  action,
}: CanEditFeeParams): boolean {
  // Admin-level users have full fee access
  const isAdminLevel = userRole === 'org:owner' || userRole === 'org:dispatcher' || userRole === 'org:admin';
  
  if (isAdminLevel) {
    return true;
  }

  // Check report stage locks for non-admin users
  if (reportStatus === 'submitted' && permissions.stage_permissions.lock_after_submit) {
    return false;
  }

  if (reportStatus === 'sent_to_customer' && permissions.stage_permissions.lock_after_customer_send) {
    return false;
  }

  if (reportStatus === 'voided' || reportStatus === 'completed') {
    return false;
  }

  // Check action-specific permissions for drivers
  if (userRole === 'org:driver') {
    switch (action) {
      case 'view':
        return permissions.fee_permissions.tech_can_see_suggestions;
      case 'add_remove':
        return permissions.fee_permissions.tech_can_add_remove_fees;
      case 'edit_amount':
        return permissions.fee_permissions.tech_can_edit_amounts;
      case 'add_custom':
        return false; // Techs can never add custom fees
      default:
        return false;
    }
  }

  // Unknown/viewer role - deny access
  return false;
}

interface CanPerformActionParams {
  userRole: AppRole;
  permissions: Permissions;
  action: 'delete_report' | 'void_report' | 'hide_photo' | 'reopen_report';
}

/**
 * Determines if a user can perform high-level report actions
 */
export function canPerformAction({
  userRole,
  permissions,
  action,
}: CanPerformActionParams): boolean {
  // Admin-level users have elevated access
  const isAdmin = userRole === 'org:owner' || userRole === 'org:dispatcher' || userRole === 'org:admin';

  switch (action) {
    case 'delete_report':
      return permissions.delete_void_permissions.admin_can_delete && isAdmin;
    
    case 'void_report':
      return permissions.delete_void_permissions.office_can_void && isAdmin;
    
    case 'hide_photo':
      return permissions.photo_permissions.office_can_hide_photos && isAdmin;
    
    case 'reopen_report':
      return permissions.stage_permissions.admin_can_reopen && isAdmin;
    
    default:
      return false;
  }
}

/**
 * Checks if a field should be visible to customers (not internal-only)
 */
export function isFieldVisibleToCustomer(
  fieldId: string,
  permissions: Permissions
): boolean {
  return !permissions.internal_only_fields.includes(fieldId);
}

/**
 * Gets a user-friendly message explaining why a field is locked
 */
export function getFieldLockReason(
  userRole: AppRole,
  reportStatus: ReportStatus,
  permissions: Permissions
): string | null {
  const isAdminLevel = userRole === 'org:owner' || userRole === 'org:dispatcher' || userRole === 'org:admin';
  
  if (isAdminLevel) {
    return null; // Never locked for admin-level users
  }

  if (reportStatus === 'submitted' && permissions.stage_permissions.lock_after_submit) {
    return 'Report is locked after submission. Contact office to make changes.';
  }

  if (reportStatus === 'sent_to_customer' && permissions.stage_permissions.lock_after_customer_send) {
    return 'Report is locked after sending to customer. Only admins can reopen.';
  }

  if (reportStatus === 'voided') {
    return 'This report has been voided and cannot be edited.';
  }

  if (reportStatus === 'completed') {
    return 'This report is completed and locked. Contact an admin to reopen.';
  }

  return null;
}
