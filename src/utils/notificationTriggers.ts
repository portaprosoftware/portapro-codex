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
