import { WorkOrder } from '@/components/fleet/work-orders/types';

export function exportWorkOrdersToCSV(workOrders: WorkOrder[], filename: string = 'work-orders.csv') {
  // Define CSV headers
  const headers = [
    'Work Order #',
    'Status',
    'Priority',
    'Source',
    'Asset',
    'Asset Type',
    'Assignee',
    'Due Date',
    'Opened Date',
    'Completed Date',
    'Total Cost',
    'Out of Service',
    'Description'
  ];

  // Convert work orders to CSV rows
  const rows = workOrders.map(wo => [
    wo.work_order_number,
    wo.status,
    wo.priority,
    wo.source,
    wo.asset_name || wo.asset_id,
    wo.asset_type,
    wo.assignee_name || 'Unassigned',
    wo.due_date ? new Date(wo.due_date).toLocaleDateString() : '',
    wo.created_at ? new Date(wo.created_at).toLocaleDateString() : '',
    wo.status === 'completed' && wo.updated_at ? new Date(wo.updated_at).toLocaleDateString() : '',
    wo.total_cost ? `$${wo.total_cost.toFixed(2)}` : '',
    wo.out_of_service ? 'Yes' : 'No',
    wo.description ? `"${wo.description.replace(/"/g, '""')}"` : ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
