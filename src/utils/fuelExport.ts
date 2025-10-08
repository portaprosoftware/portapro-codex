import { UnifiedFuelConsumption } from '@/hooks/useUnifiedFuelConsumption';

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
