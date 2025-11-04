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

/**
 * Helper function to send route schedule change notification
 */
export async function sendRouteScheduleChangeNotification(
  userId: string,
  changeType: string,
  driverName: string,
  jobNumber?: string
) {
  return sendPushNotification({
    userId,
    title: 'Route Schedule Changed',
    body: `${changeType} for ${driverName}${jobNumber ? ` - Job ${jobNumber}` : ''}`,
    notificationType: NotificationTypes.ROUTE_SCHEDULE_CHANGES,
    url: '/jobs/dispatch',
    data: { changeType, driverName, jobNumber, type: 'route_schedule_change' },
  });
}

/**
 * Helper function to send quote update notification
 */
export async function sendQuoteUpdateNotification(
  userId: string,
  quoteNumber: string,
  status: string,
  customerName: string
) {
  return sendPushNotification({
    userId,
    title: 'Quote Update',
    body: `Quote ${quoteNumber} for ${customerName} is now ${status}`,
    notificationType: NotificationTypes.CUSTOMER_UPDATES,
    url: '/quotes',
    data: { quoteNumber, status, customerName, type: 'quote_update' },
  });
}

/**
 * Helper function to send payment confirmation notification
 */
export async function sendPaymentConfirmationNotification(
  userId: string,
  amount: number,
  customerName: string,
  invoiceNumber?: string
) {
  return sendPushNotification({
    userId,
    title: 'Payment Received',
    body: `$${amount.toFixed(2)} payment from ${customerName}${invoiceNumber ? ` for ${invoiceNumber}` : ''}`,
    notificationType: NotificationTypes.PAYMENT_CONFIRMATIONS,
    url: '/invoices',
    data: { amount, customerName, invoiceNumber, type: 'payment_confirmation' },
  });
}

/**
 * Helper function to send low stock alert notification
 */
export async function sendLowStockAlertNotification(
  userId: string,
  itemName: string,
  currentStock: number,
  minStock: number
) {
  return sendPushNotification({
    userId,
    title: 'Low Stock Alert',
    body: `${itemName} is low: ${currentStock} units (minimum ${minStock})`,
    notificationType: NotificationTypes.INVENTORY_ALERTS,
    url: '/inventory',
    data: { itemName, currentStock, minStock, type: 'low_stock_alert' },
  });
}

/**
 * Helper function to send asset movement notification
 */
export async function sendAssetMovementNotification(
  userId: string,
  assetName: string,
  movementType: string,
  location?: string
) {
  return sendPushNotification({
    userId,
    title: 'Asset Movement',
    body: `${assetName} has been ${movementType}${location ? ` at ${location}` : ''}`,
    notificationType: NotificationTypes.DISPATCH_UPDATES,
    url: '/inventory',
    data: { assetName, movementType, location, type: 'asset_movement' },
  });
}

/**
 * Helper function to send vehicle status change notification
 */
export async function sendVehicleStatusChangeNotification(
  userId: string,
  vehicleName: string,
  newStatus: string,
  reason?: string
) {
  return sendPushNotification({
    userId,
    title: 'Vehicle Status Update',
    body: `${vehicleName} is now ${newStatus}${reason ? ` - ${reason}` : ''}`,
    notificationType: NotificationTypes.MAINTENANCE_ALERTS,
    url: '/fleet',
    data: { vehicleName, newStatus, reason, type: 'vehicle_status_change' },
  });
}

/**
 * Helper function to send driver check-in notification
 */
export async function sendDriverCheckInNotification(
  userId: string,
  driverName: string,
  checkinType: string,
  jobNumber?: string
) {
  return sendPushNotification({
    userId,
    title: 'Driver Check-In',
    body: `${driverName} - ${checkinType}${jobNumber ? ` for Job ${jobNumber}` : ''}`,
    notificationType: NotificationTypes.DISPATCH_UPDATES,
    url: '/jobs/dispatch',
    data: { driverName, checkinType, jobNumber, type: 'driver_checkin' },
  });
}

/**
 * Helper function to send new team member notification
 */
export async function sendNewTeamMemberNotification(
  userId: string,
  newMemberName: string,
  role: string
) {
  return sendPushNotification({
    userId,
    title: 'New Team Member',
    body: `${newMemberName} has joined as ${role}`,
    notificationType: NotificationTypes.SYSTEM_UPDATES,
    url: '/settings/team',
    data: { newMemberName, role, type: 'new_team_member' },
  });
}

/**
 * Helper function to send comment mention notification
 */
export async function sendCommentMentionNotification(
  userId: string,
  mentionerName: string,
  entityType: string,
  commentPreview: string,
  entityUrl?: string
) {
  return sendPushNotification({
    userId,
    title: `${mentionerName} mentioned you`,
    body: `In ${entityType}: ${commentPreview}`,
    notificationType: NotificationTypes.NEW_MESSAGES,
    url: entityUrl || '/dashboard',
    data: { mentionerName, entityType, commentPreview, type: 'comment_mention' },
  });
}

