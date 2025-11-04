// Email template generators for all notification types

export interface JobAssignmentData {
  jobNumber: string;
  customerName: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime?: string;
  locationAddress: string;
  specialInstructions?: string;
  jobId: string;
}

export function generateJobAssignmentEmail(data: JobAssignmentData): string {
  return `
    <h2>New Job Assignment</h2>
    <p>You have been assigned to a new job:</p>
    
    <div class="info-box">
      <p><strong>Job #:</strong> ${data.jobNumber}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Service Type:</strong> ${data.serviceType}</p>
      <p><strong>Scheduled:</strong> ${data.scheduledDate}${data.scheduledTime ? ' at ' + data.scheduledTime : ''}</p>
      <p><strong>Location:</strong> ${data.locationAddress}</p>
      ${data.specialInstructions ? `<p><strong>Special Instructions:</strong> ${data.specialInstructions}</p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/jobs/${data.jobId}" class="button">View Job Details</a>
    </p>
  `;
}

export interface RouteScheduleChangeData {
  driverName: string;
  changeType: string;
  originalDate?: string;
  newDate?: string;
  affectedJobs: Array<{ jobNumber: string; customerName: string; newTime?: string }>;
  reason?: string;
}

export function generateRouteScheduleChangeEmail(data: RouteScheduleChangeData): string {
  const jobsList = data.affectedJobs.map(job => 
    `<li>Job #${job.jobNumber} - ${job.customerName}${job.newTime ? ' at ' + job.newTime : ''}</li>`
  ).join('');

  return `
    <h2>Route Schedule Change</h2>
    <p>Your route schedule has been updated:</p>
    
    <div class="info-box">
      <p><strong>Change Type:</strong> ${data.changeType}</p>
      ${data.originalDate && data.newDate ? `<p><strong>Date Change:</strong> ${data.originalDate} → ${data.newDate}</p>` : ''}
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
    </div>
    
    <h3>Affected Jobs:</h3>
    <ul style="list-style-type: none; padding: 0;">
      ${jobsList}
    </ul>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/schedule" class="button">View Updated Schedule</a>
    </p>
  `;
}

export interface MaintenanceAlertData {
  vehicleName: string;
  vehicleId: string;
  maintenanceType: string;
  dueDate?: string;
  currentMileage?: number;
  dueMileage?: number;
  lastMaintenanceDate?: string;
  priority: 'routine' | 'urgent' | 'critical';
}

export function generateMaintenanceAlertEmail(data: MaintenanceAlertData): string {
  const priorityColors: Record<string, string> = {
    routine: '#667eea',
    urgent: '#f59e0b',
    critical: '#ef4444'
  };

  return `
    <h2 style="color: ${priorityColors[data.priority]}">Maintenance Alert</h2>
    <p>Vehicle maintenance is ${data.priority === 'critical' ? 'critically overdue' : 'due soon'}:</p>
    
    <div class="info-box" style="border-left-color: ${priorityColors[data.priority]}">
      <p><strong>Vehicle:</strong> ${data.vehicleName}</p>
      <p><strong>Maintenance Type:</strong> ${data.maintenanceType}</p>
      ${data.dueDate ? `<p><strong>Due Date:</strong> ${data.dueDate}</p>` : ''}
      ${data.currentMileage && data.dueMileage ? `<p><strong>Mileage:</strong> ${data.currentMileage.toLocaleString()} / ${data.dueMileage.toLocaleString()} miles</p>` : ''}
      ${data.lastMaintenanceDate ? `<p><strong>Last Service:</strong> ${data.lastMaintenanceDate}</p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/fleet/vehicles/${data.vehicleId}" class="button">Schedule Maintenance</a>
    </p>
  `;
}

export interface InvoiceReminderData {
  invoiceNumber: string;
  customerName: string;
  amount: number;
  dueDate: string;
  daysOverdue?: number;
  paymentLink?: string;
  invoiceId: string;
}

export function generateInvoiceReminderEmail(data: InvoiceReminderData): string {
  const isOverdue = data.daysOverdue && data.daysOverdue > 0;
  
  return `
    <h2 style="color: ${isOverdue ? '#ef4444' : '#667eea'}">${isOverdue ? 'Overdue' : 'Upcoming'} Invoice Payment</h2>
    <p>${isOverdue ? `This invoice is ${data.daysOverdue} days overdue.` : 'This invoice is due soon.'}</p>
    
    <div class="info-box" style="border-left-color: ${isOverdue ? '#ef4444' : '#667eea'}">
      <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Amount Due:</strong> $${data.amount.toFixed(2)}</p>
      <p><strong>Due Date:</strong> ${data.dueDate}</p>
    </div>
    
    <p style="text-align: center;">
      ${data.paymentLink ? 
        `<a href="${data.paymentLink}" class="button">Pay Now</a>` : 
        `<a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/invoices/${data.invoiceId}" class="button">View Invoice</a>`
      }
    </p>
  `;
}

export interface PaymentConfirmationData {
  invoiceNumber: string;
  customerName: string;
  amountPaid: number;
  paymentMethod: string;
  paymentDate: string;
  remainingBalance?: number;
  invoiceId: string;
}

export function generatePaymentConfirmationEmail(data: PaymentConfirmationData): string {
  return `
    <h2 style="color: #10b981">Payment Received</h2>
    <p>Thank you! Your payment has been successfully processed.</p>
    
    <div class="info-box" style="border-left-color: #10b981">
      <p><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
      <p><strong>Customer:</strong> ${data.customerName}</p>
      <p><strong>Amount Paid:</strong> $${data.amountPaid.toFixed(2)}</p>
      <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
      <p><strong>Payment Date:</strong> ${data.paymentDate}</p>
      ${data.remainingBalance && data.remainingBalance > 0 ? 
        `<p><strong>Remaining Balance:</strong> $${data.remainingBalance.toFixed(2)}</p>` : 
        '<p style="color: #10b981;"><strong>Status:</strong> Paid in Full ✓</p>'}
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/invoices/${data.invoiceId}" class="button">View Receipt</a>
    </p>
  `;
}

export interface LowStockAlertData {
  itemName: string;
  itemSku?: string;
  currentQuantity: number;
  threshold: number;
  unitsDeployed?: number;
  suggestedReorderQty?: number;
  itemId: string;
}

export function generateLowStockAlertEmail(data: LowStockAlertData): string {
  const severity = data.currentQuantity === 0 ? 'critical' : data.currentQuantity < data.threshold / 2 ? 'high' : 'medium';
  const severityColor = severity === 'critical' ? '#ef4444' : severity === 'high' ? '#f59e0b' : '#667eea';

  return `
    <h2 style="color: ${severityColor}">${data.currentQuantity === 0 ? 'Out of Stock' : 'Low Stock Alert'}</h2>
    <p>Inventory levels are ${data.currentQuantity === 0 ? 'depleted' : 'below threshold'}:</p>
    
    <div class="info-box" style="border-left-color: ${severityColor}">
      <p><strong>Item:</strong> ${data.itemName}</p>
      ${data.itemSku ? `<p><strong>SKU:</strong> ${data.itemSku}</p>` : ''}
      <p><strong>Current Stock:</strong> ${data.currentQuantity} units</p>
      <p><strong>Threshold:</strong> ${data.threshold} units</p>
      ${data.unitsDeployed ? `<p><strong>Units Deployed:</strong> ${data.unitsDeployed}</p>` : ''}
      ${data.suggestedReorderQty ? `<p><strong>Suggested Reorder:</strong> ${data.suggestedReorderQty} units</p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/inventory/${data.itemId}" class="button">Reorder Now</a>
    </p>
  `;
}

export interface AssetMovementData {
  unitNumber: string;
  unitType: string;
  movementType: 'delivery' | 'pickup' | 'relocation' | 'return';
  customerName?: string;
  fromLocation?: string;
  toLocation: string;
  driverName: string;
  timestamp: string;
  hasSignature: boolean;
}

export function generateAssetMovementEmail(data: AssetMovementData): string {
  const movementLabels = {
    delivery: 'Delivered',
    pickup: 'Picked Up',
    relocation: 'Relocated',
    return: 'Returned to Yard'
  };

  return `
    <h2>Asset Movement: ${movementLabels[data.movementType]}</h2>
    <p>Unit has been ${movementLabels[data.movementType].toLowerCase()}:</p>
    
    <div class="info-box">
      <p><strong>Unit:</strong> ${data.unitNumber} (${data.unitType})</p>
      ${data.customerName ? `<p><strong>Customer:</strong> ${data.customerName}</p>` : ''}
      ${data.fromLocation ? `<p><strong>From:</strong> ${data.fromLocation}</p>` : ''}
      <p><strong>To:</strong> ${data.toLocation}</p>
      <p><strong>Driver:</strong> ${data.driverName}</p>
      <p><strong>Timestamp:</strong> ${data.timestamp}</p>
      <p><strong>Signature:</strong> ${data.hasSignature ? '✓ Signed' : 'Not Signed'}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/inventory" class="button">View Inventory</a>
    </p>
  `;
}

export interface VehicleStatusChangeData {
  vehicleName: string;
  vehicleId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  impactedJobs?: number;
  estimatedReturnDate?: string;
}

export function generateVehicleStatusChangeEmail(data: VehicleStatusChangeData): string {
  const isOutOfService = data.newStatus.toLowerCase().includes('service') || data.newStatus.toLowerCase().includes('maintenance');

  return `
    <h2 style="color: ${isOutOfService ? '#ef4444' : '#10b981'}">Vehicle Status Change</h2>
    <p>Vehicle status has been updated:</p>
    
    <div class="info-box" style="border-left-color: ${isOutOfService ? '#ef4444' : '#10b981'}">
      <p><strong>Vehicle:</strong> ${data.vehicleName}</p>
      <p><strong>Status Change:</strong> ${data.oldStatus} → ${data.newStatus}</p>
      ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
      ${data.impactedJobs ? `<p><strong>Impacted Jobs:</strong> ${data.impactedJobs}</p>` : ''}
      ${data.estimatedReturnDate ? `<p><strong>Estimated Return:</strong> ${data.estimatedReturnDate}</p>` : ''}
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/fleet/vehicles/${data.vehicleId}" class="button">View Vehicle Details</a>
    </p>
  `;
}

export interface CommentMentionData {
  mentionedBy: string;
  mentionedByRole: string;
  context: string;
  contextType: 'job' | 'service_report' | 'customer';
  commentPreview: string;
  fullComment: string;
  linkUrl: string;
}

export function generateCommentMentionEmail(data: CommentMentionData): string {
  return `
    <h2>You Were Mentioned</h2>
    <p><strong>${data.mentionedBy}</strong> (${data.mentionedByRole}) mentioned you in ${data.contextType === 'job' ? 'a job' : data.contextType === 'service_report' ? 'a service report' : 'customer communications'}:</p>
    
    <div class="info-box">
      <p><strong>Context:</strong> ${data.context}</p>
      <p style="margin-top: 10px; font-style: italic;">"${data.commentPreview}..."</p>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 15px; margin: 15px 0; border-radius: 4px;">
      <p><strong>Full Comment:</strong></p>
      <p>${data.fullComment}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${data.linkUrl}" class="button">View and Reply</a>
    </p>
  `;
}

export interface NewTeamMemberData {
  memberName: string;
  memberEmail: string;
  role: string;
  invitedBy: string;
  joinedDate: string;
  isWelcomeEmail?: boolean;
}

export function generateNewTeamMemberEmail(data: NewTeamMemberData): string {
  if (data.isWelcomeEmail) {
    return `
      <h2>Welcome to PortaPro!</h2>
      <p>Hi ${data.memberName},</p>
      <p>Your account has been created and you've been assigned the role of <strong>${data.role}</strong>.</p>
      
      <div class="info-box">
        <p><strong>Getting Started:</strong></p>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Log in to your account using the link below</li>
          <li>Complete your profile information</li>
          <li>Review the training resources</li>
          <li>Contact support if you need any assistance</li>
        </ul>
      </div>
      
      <p style="text-align: center;">
        <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/login" class="button">Log In to PortaPro</a>
      </p>
      
      <p>If you have any questions, please contact your administrator or reach out to our support team.</p>
    `;
  }

  return `
    <h2>New Team Member Added</h2>
    <p>A new team member has joined your organization:</p>
    
    <div class="info-box">
      <p><strong>Name:</strong> ${data.memberName}</p>
      <p><strong>Email:</strong> ${data.memberEmail}</p>
      <p><strong>Role:</strong> ${data.role}</p>
      <p><strong>Invited By:</strong> ${data.invitedBy}</p>
      <p><strong>Joined:</strong> ${data.joinedDate}</p>
    </div>
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/settings/team" class="button">View Team Members</a>
    </p>
  `;
}

export interface DriverCheckInData {
  driverName: string;
  checkInType: 'start' | 'complete';
  checkInTime: string;
  jobsCompleted?: number;
  jobsRemaining?: number;
  totalUnitsServiced?: number;
  routeCompletionPercentage?: number;
  issuesReported?: string[];
}

export function generateDriverCheckInEmail(data: DriverCheckInData): string {
  const isComplete = data.checkInType === 'complete';

  return `
    <h2>${isComplete ? 'Route Completed' : 'Route Started'}</h2>
    <p><strong>${data.driverName}</strong> has ${isComplete ? 'completed their daily route' : 'started their daily route'}:</p>
    
    <div class="info-box">
      <p><strong>${isComplete ? 'Completion' : 'Start'} Time:</strong> ${data.checkInTime}</p>
      ${data.jobsCompleted !== undefined ? `<p><strong>Jobs Completed:</strong> ${data.jobsCompleted}</p>` : ''}
      ${data.jobsRemaining !== undefined ? `<p><strong>Jobs Remaining:</strong> ${data.jobsRemaining}</p>` : ''}
      ${data.totalUnitsServiced !== undefined ? `<p><strong>Units Serviced:</strong> ${data.totalUnitsServiced}</p>` : ''}
      ${data.routeCompletionPercentage !== undefined ? `<p><strong>Route Progress:</strong> ${data.routeCompletionPercentage}%</p>` : ''}
    </div>
    
    ${data.issuesReported && data.issuesReported.length > 0 ? `
      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 15px 0; border-radius: 4px;">
        <p><strong>Issues Reported:</strong></p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          ${data.issuesReported.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    
    <p style="text-align: center;">
      <a href="${Deno.env.get('VITE_APP_URL') || 'https://app.portaprosoftware.com'}/dispatch" class="button">View Dispatch Dashboard</a>
    </p>
  `;
}
