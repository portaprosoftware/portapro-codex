import { supabase } from "@/integrations/supabase/client";

/**
 * Trigger job assignment notification when a job is assigned to a driver
 */
export async function triggerJobAssignmentNotification(params: {
  jobId: string;
  driverId: string;
  jobNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string | null;
  locationAddress: string;
  specialInstructions?: string | null;
}) {
  try {
    console.log('[Notification] Triggering job assignment notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-job-assignment', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering job assignment:', error);
      return { success: false, error };
    }

    console.log('[Notification] Job assignment notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerJobAssignmentNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger invoice reminder notification
 */
export async function triggerInvoiceReminderNotification(params: {
  invoiceId: string;
  userId: string;
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  paymentLink?: string;
}) {
  try {
    console.log('[Notification] Triggering invoice reminder notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-invoice-reminder', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering invoice reminder:', error);
      return { success: false, error };
    }

    console.log('[Notification] Invoice reminder notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerInvoiceReminderNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger maintenance alert notification
 */
export async function triggerMaintenanceAlertNotification(params: {
  vehicleId: string;
  userIds: string[];
  vehicleName: string;
  maintenanceType: string;
  priority: 'routine' | 'urgent' | 'critical';
  dueDate?: string;
  currentMileage?: number;
  dueMileage?: number;
  lastMaintenanceDate?: string;
}) {
  try {
    console.log('[Notification] Triggering maintenance alert notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-maintenance-alert', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering maintenance alert:', error);
      return { success: false, error };
    }

    console.log('[Notification] Maintenance alert notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerMaintenanceAlertNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger low stock alert notification
 */
export async function triggerLowStockAlertNotification(params: {
  itemId: string;
  userIds: string[];
  itemName: string;
  itemSku?: string;
  currentQuantity: number;
  threshold: number;
  unitsDeployed?: number;
  suggestedReorderQty?: number;
}) {
  try {
    console.log('[Notification] Triggering low stock alert notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-low-stock-alert', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering low stock alert:', error);
      return { success: false, error };
    }

    console.log('[Notification] Low stock alert notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerLowStockAlertNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger work order status change notification
 */
export async function triggerWorkOrderStatusChangeNotification(params: {
  workOrderId: string;
  workOrderNumber: string;
  assetName: string;
  oldStatus: string;
  newStatus: string;
  assigneeId?: string | null;
  priority: string;
  changedBy: string;
  notes?: string;
}) {
  try {
    console.log('[Notification] Triggering work order status change notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-work-order-status-change', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering work order status change:', error);
      return { success: false, error };
    }

    console.log('[Notification] Work order status change notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerWorkOrderStatusChangeNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger route/schedule change notification
 */
export async function triggerRouteScheduleChangeNotification(params: {
  driverId: string;
  changeType: 'route_change' | 'schedule_change' | 'shift_reassignment';
  oldValue?: string;
  newValue?: string;
  effectiveDate: string;
  reason?: string;
  jobNumbers?: string[];
}) {
  try {
    console.log('[Notification] Triggering route schedule change notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-route-schedule-change', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering route schedule change:', error);
      return { success: false, error };
    }

    console.log('[Notification] Route schedule change notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerRouteScheduleChangeNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger quote update notification
 */
export async function triggerQuoteUpdateNotification(params: {
  quoteId: string;
  customerId: string;
  quoteNumber: string;
  customerName: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'declined' | 'expired';
  totalAmount: number;
  validUntil?: string;
  quoteLink?: string;
  notifyTeam?: boolean;
  teamUserIds?: string[];
}) {
  try {
    console.log('[Notification] Triggering quote update notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-quote-update', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering quote update:', error);
      return { success: false, error };
    }

    console.log('[Notification] Quote update notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerQuoteUpdateNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger payment confirmation notification
 */
export async function triggerPaymentConfirmationNotification(params: {
  invoiceId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
  paymentDate: string;
  receiptUrl?: string;
  notifyTeam?: boolean;
  teamUserIds?: string[];
}) {
  try {
    console.log('[Notification] Triggering payment confirmation notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-payment-confirmation', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering payment confirmation:', error);
      return { success: false, error };
    }

    console.log('[Notification] Payment confirmation notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerPaymentConfirmationNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger asset movement notification
 */
export async function triggerAssetMovementNotification(params: {
  assetId: string;
  assetName: string;
  assetSku?: string;
  movementType: 'deployed' | 'returned' | 'transferred' | 'relocated';
  fromLocation?: string;
  toLocation?: string;
  jobNumber?: string;
  driverId?: string;
  quantity?: number;
  notifyUserIds: string[];
}) {
  try {
    console.log('[Notification] Triggering asset movement notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-asset-movement', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering asset movement:', error);
      return { success: false, error };
    }

    console.log('[Notification] Asset movement notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerAssetMovementNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger vehicle status change notification
 */
export async function triggerVehicleStatusChangeNotification(params: {
  vehicleId: string;
  vehicleName: string;
  oldStatus: string;
  newStatus: 'available' | 'in_use' | 'maintenance' | 'out_of_service';
  assignedDriverId?: string;
  reason?: string;
  estimatedReturnDate?: string;
  notifyUserIds: string[];
}) {
  try {
    console.log('[Notification] Triggering vehicle status change notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-vehicle-status-change', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering vehicle status change:', error);
      return { success: false, error };
    }

    console.log('[Notification] Vehicle status change notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerVehicleStatusChangeNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger driver check-in notification
 */
export async function triggerDriverCheckinNotification(params: {
  driverId: string;
  driverName: string;
  checkinType: 'start_shift' | 'end_shift' | 'break_start' | 'break_end' | 'job_arrival' | 'job_departure';
  timestamp: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  jobNumber?: string;
  vehicleId?: string;
  notes?: string;
  notifyUserIds: string[];
}) {
  try {
    console.log('[Notification] Triggering driver checkin notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-driver-checkin', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering driver checkin:', error);
      return { success: false, error };
    }

    console.log('[Notification] Driver checkin notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerDriverCheckinNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger new team member notification
 */
export async function triggerNewTeamMemberNotification(params: {
  newUserId: string;
  newUserName: string;
  newUserEmail: string;
  role: string;
  department?: string;
  invitedBy?: string;
  startDate?: string;
  notifyTeam?: boolean;
  notifyUserIds?: string[];
}) {
  try {
    console.log('[Notification] Triggering new team member notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-new-team-member', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering new team member:', error);
      return { success: false, error };
    }

    console.log('[Notification] New team member notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerNewTeamMemberNotification:', error);
    return { success: false, error };
  }
}

/**
 * Trigger comment mention notification
 */
export async function triggerCommentMentionNotification(params: {
  mentionedUserId: string;
  mentionedByUserId: string;
  mentionedByUserName: string;
  commentText: string;
  entityType: 'job' | 'maintenance' | 'invoice' | 'quote' | 'vehicle' | 'asset';
  entityId: string;
  entityReference?: string;
  linkUrl?: string;
}) {
  try {
    console.log('[Notification] Triggering comment mention notification:', params);
    
    const { data, error } = await supabase.functions.invoke('trigger-comment-mention', {
      body: params
    });

    if (error) {
      console.error('[Notification] Error triggering comment mention:', error);
      return { success: false, error };
    }

    console.log('[Notification] Comment mention notification sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('[Notification] Exception in triggerCommentMentionNotification:', error);
    return { success: false, error };
  }
}
