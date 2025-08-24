
export interface AnalyticsOverview {
  jobs: {
    total: number;
    completed: number;
    completion_rate: number;
  };
  revenue: number;
  fleet_utilization: number;
  customer_growth: number; // Changed from percentage to count
}

export interface RevenueAnalytics {
  invoiced: number;
  collected: number;
  outstanding: number;
  collection_rate: number;
}

export interface OperationsAnalytics {
  deliveries: number;
  pickups: number;
  services: number;
  surveys: number;
  total: number;
}

export interface CustomerAnalytics {
  new_customers: number;
  returning_customers: number;
  total_customers: number;
  retention_rate: number;
  avg_clv: number;
}

export interface DriverAnalytics {
  active_drivers: number;
  total_jobs: number;
  completed_jobs: number;
  avg_completion_rate: number;
}
