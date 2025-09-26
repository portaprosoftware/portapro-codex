import { useUser } from "@clerk/clerk-react";
import { useUserRole } from "./useUserRole";

export interface RolePermissions {
  // Driver permissions
  canViewOwnProfile: boolean;
  canEditOwnBasicInfo: boolean;
  canUploadOwnDocuments: boolean;
  canViewOwnHistory: boolean;
  
  // Manager permissions
  canViewAllDrivers: boolean;
  canEditDriverBasicInfo: boolean;
  canViewDriverDocuments: boolean;
  canManageSchedules: boolean;
  canSendReminders: boolean;
  
  // Admin permissions
  canViewSensitiveDocuments: boolean;
  canDeleteDrivers: boolean;
  canViewAuditLogs: boolean;
  canManageCompanySettings: boolean;
  canAccessAllFeatures: boolean;
  
  // System permissions
  canUploadDocuments: boolean;
  canViewExpirationDashboard: boolean;
  canManageTraining: boolean;
  
  // Spill kit compliance permissions
  canPerformSpillKitChecks: boolean;
  canViewSpillKitHistory: boolean;
  canManageSpillKitTemplates: boolean;
  canViewSpillKitReports: boolean;
  canManageSpillKitNotifications: boolean;
  canManageSpillKitRestock: boolean;
  canViewAllSpillKitChecks: boolean;
}

export function useRoleAccess(targetDriverId?: string): RolePermissions {
  const { user } = useUser();
  const { role, isAdmin, isDispatcher, isDriver, hasAdminAccess } = useUserRole();
  
  const isOwnProfile = targetDriverId === user?.id;
  
  // Base permissions - everyone gets these
  const basePermissions: RolePermissions = {
    // Driver permissions
    canViewOwnProfile: false,
    canEditOwnBasicInfo: false,
    canUploadOwnDocuments: false,
    canViewOwnHistory: false,
    
    // Manager permissions
    canViewAllDrivers: false,
    canEditDriverBasicInfo: false,
    canViewDriverDocuments: false,
    canManageSchedules: false,
    canSendReminders: false,
    
    // Admin permissions
    canViewSensitiveDocuments: false,
    canDeleteDrivers: false,
    canViewAuditLogs: false,
    canManageCompanySettings: false,
    canAccessAllFeatures: false,
    
    // System permissions
    canUploadDocuments: false,
    canViewExpirationDashboard: false,
    canManageTraining: false,
    
    // Spill kit compliance permissions (grant to everyone)
    canPerformSpillKitChecks: true,
    canViewSpillKitHistory: true,
    canManageSpillKitTemplates: true,
    canViewSpillKitReports: true,
    canManageSpillKitNotifications: true,
    canManageSpillKitRestock: true,
    canViewAllSpillKitChecks: true,
  };

  // Driver permissions
  if (isDriver) {
    return {
      ...basePermissions,
      // Drivers can manage their own data
      canViewOwnProfile: isOwnProfile,
      canEditOwnBasicInfo: isOwnProfile,
      canUploadOwnDocuments: isOwnProfile,
      canViewOwnHistory: isOwnProfile,
      canUploadDocuments: isOwnProfile,
      
      // Drivers can perform their own spill kit checks
      canPerformSpillKitChecks: true,
      canViewSpillKitHistory: isOwnProfile,
    };
  }

  // Dispatcher/Manager permissions
  if (isDispatcher) {
    return {
      ...basePermissions,
      // Own profile management
      canViewOwnProfile: isOwnProfile,
      canEditOwnBasicInfo: isOwnProfile,
      canUploadOwnDocuments: isOwnProfile,
      canViewOwnHistory: isOwnProfile,
      
      // Manager capabilities
      canViewAllDrivers: true,
      canEditDriverBasicInfo: true,
      canViewDriverDocuments: true, // Can view most documents but not sensitive ones
      canManageSchedules: true,
      canSendReminders: true,
      canUploadDocuments: true,
      canViewExpirationDashboard: true,
      canManageTraining: true,
      
      // Dispatchers can view and manage most spill kit features
      canPerformSpillKitChecks: true,
      canViewSpillKitHistory: true,
      canViewSpillKitReports: true,
      canManageSpillKitRestock: true,
      canViewAllSpillKitChecks: true,
    };
  }

  // Admin permissions
  if (isAdmin) {
    return {
      ...basePermissions,
      // Full access to everything
      canViewOwnProfile: true,
      canEditOwnBasicInfo: true,
      canUploadOwnDocuments: true,
      canViewOwnHistory: true,
      
      canViewAllDrivers: true,
      canEditDriverBasicInfo: true,
      canViewDriverDocuments: true,
      canManageSchedules: true,
      canSendReminders: true,
      
      canViewSensitiveDocuments: true,
      canDeleteDrivers: true,
      canViewAuditLogs: true,
      canManageCompanySettings: true,
      canAccessAllFeatures: true,
      
      canUploadDocuments: true,
      canViewExpirationDashboard: true,
      canManageTraining: true,
      
      // Admins have full spill kit compliance access
      canPerformSpillKitChecks: true,
      canViewSpillKitHistory: true,
      canManageSpillKitTemplates: true,
      canViewSpillKitReports: true,
      canManageSpillKitNotifications: true,
      canManageSpillKitRestock: true,
      canViewAllSpillKitChecks: true,
    };
  }

  // Default: no permissions
  return basePermissions;
}

export function useCanAccessFeature(feature: keyof RolePermissions, targetDriverId?: string): boolean {
  const permissions = useRoleAccess(targetDriverId);
  return permissions[feature];
}

export function useDocumentAccess(documentType: 'license' | 'medical_card' | 'training' | 'other', targetDriverId?: string) {
  const { user } = useUser();
  const { isAdmin, isDispatcher, isDriver } = useUserRole();
  const isOwnProfile = targetDriverId === user?.id;
  
  const sensitiveDocuments = ['license', 'medical_card'];
  const isSensitive = sensitiveDocuments.includes(documentType);
  
  return {
    canView: isAdmin || (isDispatcher && !isSensitive) || (isDriver && isOwnProfile),
    canUpload: isAdmin || (isDriver && isOwnProfile),
    canDelete: isAdmin,
    canDownload: isAdmin || (isDispatcher && !isSensitive) || (isDriver && isOwnProfile),
    isSensitive,
  };
}