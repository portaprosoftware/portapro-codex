import { addDays } from "date-fns";

export interface WorkOrderValidationResult {
  allowed: boolean;
  reason?: string;
}

export interface WorkOrderPart {
  id: string;
  part_id?: string;
  part_name: string;
  quantity: number;
  unit_cost: number;
  source: 'truck_stock' | 'warehouse' | 'vendor';
  on_hand_qty?: number;
}

/**
 * Validates if a work order can transition to a new status
 */
export function canMoveToStatus(
  workOrder: any,
  newStatus: string
): WorkOrderValidationResult {
  
  // Cannot move to Completed unless all requirements are met
  if (newStatus === "completed") {
    if (!workOrder.technician_signature_id) {
      return { 
        allowed: false, 
        reason: "Technician signature is required before completion" 
      };
    }
    
    if (!workOrder.resolution_notes) {
      return { 
        allowed: false, 
        reason: "Resolution notes are required before completion" 
      };
    }
    
    // Vehicles and equipment require meter reading at close
    if (workOrder.asset_type === "vehicle" && !workOrder.meter_close_miles && !workOrder.meter_close_hours) {
      return { 
        allowed: false, 
        reason: "Meter reading at close is required for vehicles before completion" 
      };
    }
    
    // If driver verification is required, check for it
    if (workOrder.driver_verification_required && !workOrder.driver_verification_id) {
      return { 
        allowed: false, 
        reason: "Driver verification is required before completion" 
      };
    }
  }
  
  // Cannot move to Awaiting Parts unless at least one part is added
  if (newStatus === "awaiting_parts") {
    const parts = workOrder.work_order_parts || [];
    if (parts.length === 0) {
      return { 
        allowed: false, 
        reason: "Add at least one part to move to Awaiting Parts status" 
      };
    }
  }
  
  // Cannot move to Vendor unless vendor_id is set
  if (newStatus === "vendor") {
    if (!workOrder.vendor_id) {
      return { 
        allowed: false, 
        reason: "Select a service provider/vendor before moving to Vendor status" 
      };
    }
  }
  
  // Cannot move to Verification unless work is substantially complete
  if (newStatus === "verification") {
    if (!workOrder.technician_signature_id) {
      return {
        allowed: false,
        reason: "Technician must sign off on work before moving to Verification"
      };
    }
  }
  
  return { allowed: true };
}

/**
 * Gets the default due date based on priority level
 */
export function getDefaultDueDateForPriority(priority: string): Date | null {
  const today = new Date();
  
  switch (priority.toLowerCase()) {
    case "critical":
      return addDays(today, 1);
    case "high":
      return addDays(today, 3);
    case "normal":
      return addDays(today, 7);
    case "low":
      return null; // No default due date for low priority
    default:
      return addDays(today, 7); // Default to normal
  }
}

/**
 * Checks if any parts have quantity exceeding on-hand stock
 */
export function shouldAutoSetAwaitingParts(parts: WorkOrderPart[]): boolean {
  return parts.some(part => {
    // Only check stocked items (truck_stock or warehouse)
    if (part.source === "truck_stock" || part.source === "warehouse") {
      // If we have on_hand_qty data and it's less than requested
      if (part.on_hand_qty !== undefined && part.on_hand_qty < part.quantity) {
        return true;
      }
    }
    return false;
  });
}

/**
 * Gets the parts that are short (quantity > on_hand)
 */
export function getShortParts(parts: WorkOrderPart[]): WorkOrderPart[] {
  return parts.filter(part => {
    if (part.source === "truck_stock" || part.source === "warehouse") {
      return part.on_hand_qty !== undefined && part.on_hand_qty < part.quantity;
    }
    return false;
  });
}

/**
 * Calculates the shortage quantity for a part
 */
export function getPartShortage(part: WorkOrderPart): number {
  if (part.on_hand_qty !== undefined) {
    return Math.max(0, part.quantity - part.on_hand_qty);
  }
  return 0;
}

/**
 * Validates if work order can be saved/updated
 */
export function validateWorkOrder(workOrder: any): WorkOrderValidationResult {
  if (!workOrder.asset_id) {
    return {
      allowed: false,
      reason: "Asset/vehicle is required"
    };
  }
  
  if (!workOrder.description || workOrder.description.trim().length === 0) {
    return {
      allowed: false,
      reason: "Problem description is required"
    };
  }
  
  if (!workOrder.priority) {
    return {
      allowed: false,
      reason: "Priority level is required"
    };
  }
  
  return { allowed: true };
}

/**
 * Gets status transition message for history log
 */
export function getStatusTransitionMessage(
  fromStatus: string | null,
  toStatus: string,
  metadata?: any
): string {
  if (!fromStatus) {
    return `Work order created with status: ${toStatus}`;
  }
  
  const messages: Record<string, string> = {
    "open_to_in_progress": "Work started",
    "in_progress_to_awaiting_parts": "Waiting for parts to arrive",
    "in_progress_to_vendor": "Sent to external vendor",
    "in_progress_to_on_hold": "Work paused",
    "awaiting_parts_to_in_progress": "Parts received, work resumed",
    "vendor_to_verification": "Vendor work completed, awaiting verification",
    "in_progress_to_verification": "Work completed, awaiting verification",
    "verification_to_completed": "Verification passed, work order completed",
    "on_hold_to_in_progress": "Work resumed",
  };
  
  const key = `${fromStatus}_to_${toStatus}`;
  return messages[key] || `Status changed from ${fromStatus} to ${toStatus}`;
}

/**
 * Determines if a status requires specific actions
 */
export function getStatusRequirements(status: string): string[] {
  const requirements: Record<string, string[]> = {
    "completed": [
      "Technician signature",
      "Resolution notes",
      "Meter reading at close (for vehicles)"
    ],
    "awaiting_parts": [
      "At least one part added"
    ],
    "vendor": [
      "Service provider selected",
      "PO number (optional)"
    ],
    "verification": [
      "Technician signature",
      "Work substantially complete"
    ]
  };
  
  return requirements[status] || [];
}

/**
 * Gets the next logical status based on current status
 */
export function getNextLogicalStatus(currentStatus: string): string[] {
  const nextStatuses: Record<string, string[]> = {
    "open": ["in_progress"],
    "in_progress": ["awaiting_parts", "vendor", "on_hold", "verification"],
    "awaiting_parts": ["in_progress"],
    "vendor": ["verification", "in_progress"],
    "on_hold": ["in_progress"],
    "verification": ["completed", "in_progress"],
    "completed": [] // No transitions from completed
  };
  
  return nextStatuses[currentStatus] || [];
}

/**
 * Checks if a work order is overdue
 */
export function isWorkOrderOverdue(workOrder: any): boolean {
  if (!workOrder.due_date) return false;
  if (workOrder.status === "completed") return false;
  
  return new Date(workOrder.due_date) < new Date();
}

/**
 * Calculates work order age in days
 */
export function getWorkOrderAge(workOrder: any): number {
  const createdDate = new Date(workOrder.created_at);
  const endDate = workOrder.closed_at ? new Date(workOrder.closed_at) : new Date();
  
  const diffTime = Math.abs(endDate.getTime() - createdDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Gets color/badge variant for priority
 */
export function getPriorityVariant(priority: string): "default" | "secondary" | "destructive" | "outline" {
  switch (priority.toLowerCase()) {
    case "critical":
      return "destructive";
    case "high":
      return "secondary";
    case "normal":
      return "outline";
    case "low":
      return "outline";
    default:
      return "outline";
  }
}

/**
 * Gets color/badge variant for status
 */
export function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
      return "default";
    case "in_progress":
      return "secondary";
    case "awaiting_parts":
    case "vendor":
    case "on_hold":
      return "outline";
    case "verification":
      return "secondary";
    default:
      return "outline";
  }
}
