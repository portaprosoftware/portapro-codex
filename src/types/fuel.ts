// Fuel Management Type Definitions

export type FuelType = 'diesel' | 'gasoline' | 'off_road_diesel';
export type FuelSource = 'retail' | 'yard_tank' | 'mobile_service';

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
}

export interface FuelTankDelivery {
  id: string;
  tank_id: string;
  delivery_date: string;
  gallons_delivered: number;
  total_cost: number;
  cost_per_gallon: number;
  supplier_name?: string;
  invoice_number?: string;
  notes?: string;
  fuel_tanks?: FuelTank;
  created_at: string;
  updated_at: string;
}

export interface MobileFuelVendor {
  id: string;
  vendor_name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  fuel_type: FuelType;
  service_area?: string;
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
