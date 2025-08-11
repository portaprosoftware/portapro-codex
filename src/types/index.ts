// Global type definitions for PortaPro

export type UserRole = "admin" | "dispatcher" | "driver";

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  imageUrl?: string;
  role: UserRole;
}

// Common status types
export type JobStatus = "pending" | "assigned" | "unassigned" | "in-progress" | "completed" | "cancelled";
export type VehicleStatus = "available" | "maintenance" | "in_use" | "retired";
export type InventoryStatus = "in_stock" | "low_stock" | "out_of_stock";

// Customer types
export type CustomerType = 
  | "bars_restaurants" 
  | "construction" 
  | "emergency_disaster_relief"
  | "events_festivals" 
  | "municipal_government" 
  | "other"
  | "private_events_weddings" 
  | "retail" 
  | "sports_recreation";