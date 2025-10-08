// Fuel Management Type Definitions

export type FuelType = 'diesel' | 'gasoline' | 'off_road_diesel';
export type FuelSource = 'retail' | 'yard_tank' | 'mobile_service';
export type TankType = 'above_ground' | 'underground' | 'mobile_skid';
export type DispenserType = 'gravity' | 'electric_pump' | 'manual';
export type AlertType = 'low_inventory' | 'spcc_compliance' | 'inspection_due' | 'grade_mismatch' | 'overfill_risk';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface FuelStation {
  id: string;
  station_name: string;
  brand?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  gps_coordinates?: { x: number; y: number };
  station_number?: string;
  phone?: string;
  accepts_fleet_cards: boolean;
  is_preferred: boolean;
  average_price_per_gallon?: number;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuelTank {
  id: string;
  tank_number: string;
  tank_name: string;
  fuel_type: FuelType;
  capacity_gallons: number;
  current_level_gallons?: number;
  location_description?: string;
  last_inspection_date?: string;
  next_inspection_date?: string;
  requires_spcc?: boolean;
  installation_date?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Identification & Basics
  tank_type?: TankType;
  fuel_grade?: string;
  dispenser_type?: DispenserType;
  meter_serial_number?: string;
  photo_urls?: string[];
  
  // Capacity & Location
  usable_capacity_gallons?: number;
  secondary_containment_capacity?: number;
  gps_coordinates?: { x: number; y: number };
  access_notes?: string;
  
  // Compliance & Safety
  spcc_plan_on_file?: boolean;
  spcc_document_url?: string;
  overfill_protection_type?: string;
  leak_detection_method?: string;
  emergency_shutoff_location?: string;
  fire_code_permit_number?: string;
  
  // Inventory Controls
  initial_stick_reading?: number;
  reorder_threshold_gallons?: number;
  target_fill_level_gallons?: number;
  calibration_table_url?: string;
  notify_on_low_stock?: boolean;
  notification_emails?: string[];
  notification_sms?: string[];
  
  // Security
  lock_id?: string;
  tamper_seal_number?: string;
}

export interface FuelTankAlert {
  id: string;
  tank_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  message: string;
  alert_data?: Record<string, any>;
  acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  created_at: string;
  resolved_at?: string;
}

export type PaymentMethod = 'invoice' | 'ach' | 'card' | 'check' | 'cash';
export type WaterBottomResult = 'pass' | 'fail';

export interface OtherFee {
  description: string;
  amount: number;
}

export interface FuelSupplier {
  id: string;
  supplier_name: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms?: string;
  notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FuelTankDelivery {
  id: string;
  tank_id: string;
  delivery_date: string;
  delivery_time?: string;
  
  // Basic delivery info
  gallons_delivered: number;
  bol_ticket_number?: string;
  driver_name?: string;
  truck_number?: string;
  fuel_grade?: string;
  winter_blend?: boolean;
  additive_notes?: string;
  
  // Quantities & Pricing
  gross_gallons?: number;
  temperature_corrected_gallons?: number;
  price_per_gallon_pretax?: number;
  excise_tax?: number;
  delivery_fee?: number;
  hazmat_fee?: number;
  other_fees?: OtherFee[];
  total_cost: number;
  cost_per_gallon?: number;
  payment_method?: PaymentMethod;
  payment_terms?: string;
  
  // Reconciliation
  pre_delivery_stick_reading?: number;
  post_delivery_stick_reading?: number;
  water_bottom_test_result?: WaterBottomResult;
  water_bottom_inches?: number;
  calculated_variance?: number;
  variance_tolerance?: number;
  variance_flag?: boolean;
  ticket_photo_urls?: string[];
  dip_chart_url?: string;
  
  // Operational
  after_hours_delivery?: boolean;
  partial_fill_blocked?: boolean;
  blocked_reason?: string;
  
  // Legacy fields
  supplier_name?: string;
  invoice_number?: string;
  notes?: string;
  
  // Audit trail
  entered_by?: string;
  verified_by?: string;
  verified_at?: string;
  locked_to_ledger?: boolean;
  locked_at?: string;
  locked_by?: string;
  
  created_at: string;
  updated_at: string;
  fuel_tanks?: FuelTank;
}

export interface MobileFuelVendor {
  id: string;
  vendor_id?: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  after_hours_contact_person?: string;
  after_hours_phone?: string;
  preferred_contact_method?: 'phone' | 'email' | 'portal' | 'text';
  fuel_type: FuelType;
  service_area?: string;
  delivery_hours?: string;
  min_delivery_quantity_gal?: number;
  pricing_model?: 'fixed' | 'market_index' | 'cost_plus' | 'tiered';
  payment_terms?: 'net_15' | 'net_30' | 'cod' | 'prepaid';
  contract_number?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MobileFuelService {
  id: string;
  vendor_id: string;
  service_date: string;
  total_gallons: number;
  total_cost: number;
  cost_per_gallon: number;
  vehicles_fueled: number;
  location?: string;
  invoice_number?: string;
  notes?: string;
  mobile_fuel_vendors?: MobileFuelVendor;
  created_at: string;
  updated_at: string;
}

export interface EnhancedFuelLog {
  id: string;
  vehicle_id: string;
  driver_id: string;
  date: string;
  odometer_reading: number;
  gallons_purchased: number;
  cost_per_gallon: number;
  total_cost: number;
  fuel_station?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // New fields
  fuel_type: FuelType;
  fuel_source: FuelSource;
  fuel_source_id?: string;
  aux_engine_fuel: boolean;
  pump_number?: string;
  receipt_photo_url?: string;
  tax_amount?: number;
}

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  diesel: 'Diesel',
  gasoline: 'Gasoline',
  off_road_diesel: 'Off-Road Diesel',
};

export const FUEL_SOURCE_LABELS: Record<FuelSource, string> = {
  retail: 'Retail Station',
  yard_tank: 'Yard Tank',
  mobile_service: 'Mobile Service',
};

export const FUEL_TYPE_COLORS: Record<FuelType, string> = {
  diesel: 'from-amber-500 to-orange-600',
  gasoline: 'from-blue-500 to-blue-600',
  off_road_diesel: 'from-red-500 to-red-600',
};

export const FUEL_SOURCE_COLORS: Record<FuelSource, string> = {
  retail: 'from-blue-500 to-blue-600',
  yard_tank: 'from-green-500 to-green-600',
  mobile_service: 'from-purple-500 to-purple-600',
};
