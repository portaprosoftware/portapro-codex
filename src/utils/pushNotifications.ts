import { supabase } from '@/integrations/supabase/client';

export interface SendPushNotificationParams {
  userId: string;
  title: string;
  body: string;
  notificationType: string;
  data?: any;
  url?: string;
}

/**
 * Send a push notification to a user via the edge function
 * This automatically checks user preferences and active subscriptions
 */
export async function sendPushNotification(params: SendPushNotificationParams): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params,
    });

    if (error) {
      console.error('Error sending push notification:', error);
      return false;
    }

    console.log('Push notification sent:', data);
    return data?.success || false;
  } catch (error) {
    console.error('Failed to send push notification:', error);
    return false;
  }
}

/**
 * Notification type mapping for easy reference
 * These match the column names in notification_preferences table
 */
export const NotificationTypes = {
  JOB_ASSIGNMENTS: 'job_assignments',
  ROUTE_SCHEDULE_CHANGES: 'route_schedule_changes',
  DVIR_REMINDERS: 'dvir_reminders',
  INVOICE_REMINDERS: 'invoice_reminders',
  PAYMENT_CONFIRMATIONS: 'payment_confirmations',
  NEW_MESSAGES: 'new_messages',
  DISPATCH_UPDATES: 'dispatch_updates',
  MAINTENANCE_ALERTS: 'maintenance_alerts',
  DOCUMENT_EXPIRATIONS: 'document_expirations',
  SYSTEM_UPDATES: 'system_updates',
  CUSTOMER_UPDATES: 'customer_updates',
  INVENTORY_ALERTS: 'inventory_alerts',
  COMPLIANCE_ALERTS: 'compliance_alerts',
} as const;

/**
 * Helper function to send job assignment notification
 */
export async function sendJobAssignmentNotification(
  userId: string,
  jobId: string,
  jobTitle: string
) {
  return sendPushNotification({
    userId,
    title: 'New Job Assignment',
    body: `You have been assigned to: ${jobTitle}`,
    notificationType: NotificationTypes.JOB_ASSIGNMENTS,
    url: `/jobs/${jobId}`,
    data: { jobId, type: 'job_assignment' },
  });
}

/**
 * Helper function to send DVIR reminder notification
 */
export async function sendDVIRReminderNotification(
  userId: string,
  vehicleId: string,
  vehicleName: string
) {
  return sendPushNotification({
    userId,
    title: 'DVIR Reminder',
    body: `Please complete DVIR for ${vehicleName}`,
    notificationType: NotificationTypes.DVIR_REMINDERS,
    url: `/fleet/dvir?vehicle=${vehicleId}`,
    data: { vehicleId, type: 'dvir_reminder' },
  });
}

/**
 * Helper function to send invoice reminder notification
 */
export async function sendInvoiceReminderNotification(
  userId: string,
  invoiceId: string,
  amount: number,
  customerName: string
) {
  return sendPushNotification({
    userId,
    title: 'Invoice Due',
    body: `Invoice for ${customerName} - $${amount.toFixed(2)} is due soon`,
    notificationType: NotificationTypes.INVOICE_REMINDERS,
    url: `/invoices/${invoiceId}`,
    data: { invoiceId, amount, type: 'invoice_reminder' },
  });
}

/**
 * Helper function to send maintenance alert notification
 */
export async function sendMaintenanceAlertNotification(
  userId: string,
  vehicleId: string,
  vehicleName: string,
  alertType: string
) {
  return sendPushNotification({
    userId,
    title: 'Maintenance Alert',
    body: `${vehicleName}: ${alertType}`,
    notificationType: NotificationTypes.MAINTENANCE_ALERTS,
    url: `/fleet/vehicles/${vehicleId}`,
    data: { vehicleId, alertType, type: 'maintenance_alert' },
  });
}

/**
 * Helper function to send dispatch update notification
 */
export async function sendDispatchUpdateNotification(
  userId: string,
  message: string,
  routeId?: string
) {
  return sendPushNotification({
    userId,
    title: 'Dispatch Update',
    body: message,
    notificationType: NotificationTypes.DISPATCH_UPDATES,
    url: routeId ? `/routes/${routeId}` : '/dashboard',
    data: { routeId, type: 'dispatch_update' },
  });
}

/**
 * Helper function to send new message notification
 */
export async function sendNewMessageNotification(
  userId: string,
  fromUserName: string,
  messagePreview: string
) {
  return sendPushNotification({
    userId,
    title: `New message from ${fromUserName}`,
    body: messagePreview,
    notificationType: NotificationTypes.NEW_MESSAGES,
    url: '/messages',
    data: { fromUserName, type: 'new_message' },
  });
}
