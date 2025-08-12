export interface WorkOrder {
  id: string;
  work_order_number: string;
  asset_id: string;
  asset_type: "vehicle" | "trailer";
  asset_name?: string;
  assignee_name?: string | null;
  source: string;
  priority: string;
  status: string;
  description: string;
  tasks?: string[];
  due_date?: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null;
  out_of_service?: boolean;
  total_cost?: number;
  meter_at_open?: number;
}