export interface InventoryAvailabilityRow {
  product_id: string;
  product_name: string | null;
  available_count: number;
  assigned_count: number;
  maintenance_count: number;
  total_count: number;
  as_of_date: string;
  location_id: string | null;
}

export interface RouteManifestStop {
  route_id: string;
  job_id: string;
  job_number: string | null;
  job_type?: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  customer_name: string | null;
  service_address: string | null;
  stop_order: number;
  unit_codes: string[] | null;
}

export interface DashboardKpis {
  inventory: {
    totalProducts: number;
    totalUnits: number;
    maintenanceItems: number;
  };
  jobs: {
    total: number;
    deliveries: number;
    pickups: number;
    services: number;
    surveys: number;
  };
  customers: {
    total: number;
    active: number;
  };
  revenue: {
    total: number;
  };
  fuel: {
    total: number;
  };
  vehicles: {
    total: number;
    active: number;
    maintenance: number;
  };
  maintenance: {
    count: number;
  };
}

export interface ActivityFeedEntry {
  entry_type: 'job' | 'invoice';
  entity_id: string;
  job_type: string | null;
  amount: number | null;
  status: string;
  created_at: string;
  customer_name: string | null;
}

export interface DriverDebugInfoRow {
  job_id: string;
  job_number: string | null;
  driver_id: string | null;
  job_type: string | null;
  status: string | null;
  scheduled_date: string | null;
  created_at: string;
  customer_name: string | null;
}
