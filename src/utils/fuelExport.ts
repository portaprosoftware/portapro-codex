import { UnifiedFuelConsumption } from '@/hooks/useUnifiedFuelConsumption';
import { VendorPerformance, CostPerMileMetrics, FleetMPGMetrics, SourceComparison } from '@/hooks/useFuelAnalytics';

export const exportUnifiedFuelToCSV = (
  data: UnifiedFuelConsumption[],
  filename: string = 'unified-fuel-data.csv'
) => {
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // CSV headers
  const headers = [
    'Date',
    'Source Type',
    'Source Name',
    'Vehicle ID',
    'Driver ID',
    'Gallons',
    'Cost',
    'Cost Per Gallon',
    'Odometer',
    'Fuel Type',
    'Vendor ID',
    'Tank ID',
    'Notes'
  ];

  // Convert data to CSV rows
  const rows = data.map(log => [
    log.fuel_date,
    log.source_type,
    log.source_name || '',
    log.vehicle_id || '',
    log.driver_id || '',
    log.gallons?.toFixed(2) || '0',
    log.cost?.toFixed(2) || '0',
    log.cost_per_gallon?.toFixed(3) || '0',
    log.odometer_reading || '',
    log.fuel_type || '',
    log.vendor_id || '',
    log.tank_id || '',
    log.notes || ''
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
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
};

export const formatDateRange = (from?: Date, to?: Date): string => {
  if (!from && !to) return 'all-time';
  
  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };
  
  if (from && to) {
    return `${formatDate(from)}_to_${formatDate(to)}`;
  }
  
  if (from) {
    return `from_${formatDate(from)}`;
  }
  
  return `until_${formatDate(to!)}`;
};

export const exportVendorPerformanceToCSV = (
  data: VendorPerformance[],
  filename: string = 'vendor-performance.csv'
) => {
  const headers = ['Rank', 'Vendor/Source', 'Gallons', 'Total Spent', 'Avg $/Gal', 'Purchases', 'Last Purchase'];
  
  const rows = data.map((vendor, idx) => [
    `#${idx + 1}`,
    vendor.vendor_name,
    vendor.total_gallons.toFixed(1),
    vendor.total_cost.toFixed(2),
    vendor.avg_cost_per_gallon.toFixed(3),
    vendor.transaction_count,
    new Date(vendor.last_purchase_date).toLocaleDateString()
  ]);
  
  downloadCSV(headers, rows, filename);
};

export const exportCostPerMileToCSV = (
  data: CostPerMileMetrics,
  filename: string = 'cost-per-mile.csv'
) => {
  const headers = ['Vehicle', 'Miles Driven', 'Fuel Cost', 'Cost Per Mile'];
  
  const rows = data.by_vehicle.map(vehicle => [
    vehicle.license_plate,
    vehicle.miles_driven.toLocaleString(),
    vehicle.fuel_cost.toFixed(2),
    vehicle.cost_per_mile.toFixed(3)
  ]);
  
  downloadCSV(headers, rows, filename);
};

export const exportFleetMPGToCSV = (
  data: FleetMPGMetrics,
  filename: string = 'fleet-mpg.csv'
) => {
  const headers = ['Vehicle', 'Miles', 'Gallons', 'MPG'];
  
  const rows = data.by_vehicle.map(vehicle => [
    vehicle.license_plate,
    vehicle.miles.toLocaleString(),
    vehicle.gallons.toFixed(1),
    vehicle.mpg.toFixed(2)
  ]);
  
  downloadCSV(headers, rows, filename);
};

export const exportSourceComparisonToCSV = (
  data: SourceComparison[],
  filename: string = 'source-comparison.csv'
) => {
  const headers = ['Source Type', 'Gallons', 'Total Cost', 'Avg $/Gal', 'Transactions'];
  
  const rows = data.map(source => [
    source.source_type,
    source.total_gallons.toFixed(1),
    source.total_cost.toFixed(2),
    source.avg_cost_per_gallon.toFixed(3),
    source.transaction_count
  ]);
  
  downloadCSV(headers, rows, filename);
};

export const exportAnalyticsSummaryToCSV = (
  data: {
    costPerMile: number;
    totalMiles: number;
    fleetMPG: number;
    totalGallons: number;
    totalCost: number;
    sourceCount: number;
  },
  filename: string = 'analytics-summary.csv'
) => {
  const headers = ['Metric', 'Value'];
  
  const rows = [
    ['Cost Per Mile', `$${data.costPerMile.toFixed(3)}`],
    ['Total Miles Driven', data.totalMiles.toLocaleString()],
    ['Fleet Average MPG', `${data.fleetMPG.toFixed(2)} MPG`],
    ['Total Gallons Consumed', data.totalGallons.toFixed(1)],
    ['Total Fuel Cost', `$${data.totalCost.toFixed(2)}`],
    ['Active Fuel Sources', data.sourceCount.toString()]
  ];
  
  downloadCSV(headers, rows, filename);
};

// Helper function to download CSV
const downloadCSV = (headers: string[], rows: any[][], filename: string) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
