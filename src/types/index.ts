// Global type definitions for PortaPro

export type UserRole = "owner" | "dispatch" | "driver" | "customer";

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
  role: UserRole;
}

// Common status types
export type JobStatus = "pending" | "unassigned" | "assigned" | "in-progress" | "completed" | "cancelled";
export type VehicleStatus = "available" | "maintenance" | "in_use" | "retired";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

// Customer types
export type CustomerType = 
  | "events_festivals" 
  | "construction" 
  | "municipal_government" 
  | "private_events_weddings" 
  | "sports_recreation" 
  | "emergency_disaster_relief";