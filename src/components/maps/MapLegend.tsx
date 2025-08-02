import React from 'react';
import { Badge } from '@/components/ui/badge';

interface MapLegendProps {
  isDriverMode: boolean;
  filteredJobsCount: number;
  availableDrivers?: any[];
}

// Driver color palette
export const getDriverColor = (driverId: string, drivers: any[] = []) => {
  const driverColors = [
    '#0891B2', // teal-600
    '#DC2626', // red-600  
    '#D97706', // amber-600
    '#059669', // emerald-600
    '#7C3AED', // violet-600
    '#BE185D', // pink-600
    '#4338CA', // indigo-600
    '#EA580C', // orange-600
  ];
  
  const driverIndex = drivers.findIndex(d => d.id === driverId);
  return driverColors[driverIndex % driverColors.length] || '#6B7280';
};

// Job type colors
export const getJobTypeColor = (jobType: string) => {
  const colors = {
    delivery: '#3B82F6',    // blue-500
    pickup: '#10B981',      // emerald-500
    service: '#F59E0B',     // amber-500
    return: '#8B5CF6',      // violet-500
    cleaning: '#06B6D4',    // cyan-500
  };
  return colors[jobType] || '#6B7280';
};

// Status border colors
export const getStatusBorderColor = (status: string, isOverdue = false, isPriority = false) => {
  if (isOverdue) return '#EF4444'; // red-500
  if (isPriority) return '#F59E0B'; // amber-500
  
  const colors = {
    assigned: '#6B7280',      // gray-500
    in_progress: '#EAB308',   // yellow-500
    completed: '#22C55E',     // green-500
    cancelled: '#374151',     // gray-700
    rescheduled: '#1E40AF',   // blue-700
  };
  return colors[status] || '#6B7280';
};

export const MapLegend: React.FC<MapLegendProps> = ({ 
  isDriverMode, 
  filteredJobsCount, 
  availableDrivers = [] 
}) => {
  const jobTypes = [
    { key: 'delivery', label: 'Delivery', color: getJobTypeColor('delivery') },
    { key: 'pickup', label: 'Pickup', color: getJobTypeColor('pickup') },
    { key: 'service', label: 'Service', color: getJobTypeColor('service') },
    { key: 'return', label: 'Return', color: getJobTypeColor('return') },
    { key: 'cleaning', label: 'Cleaning', color: getJobTypeColor('cleaning') },
  ];

  const jobStatuses = [
    { key: 'assigned', label: 'Assigned', color: getStatusBorderColor('assigned') },
    { key: 'in_progress', label: 'In Progress', color: getStatusBorderColor('in_progress') },
    { key: 'completed', label: 'Completed', color: getStatusBorderColor('completed') },
    { key: 'overdue', label: 'Overdue', color: getStatusBorderColor('', true) },
    { key: 'priority', label: 'Priority', color: getStatusBorderColor('', false, true) },
    { key: 'cancelled', label: 'Cancelled', color: getStatusBorderColor('cancelled') },
  ];

  return (
    <div className="bg-white rounded-lg border shadow-sm p-4">
      <div className="space-y-4">
        {/* Mode Explanation */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">
            {isDriverMode ? 'Driver Mode' : 'Standard Mode'}
          </h3>
          <p className="text-xs text-gray-600">
            {isDriverMode 
              ? 'Jobs are colored by driver assignment, with status shown as border color.'
              : 'Jobs are colored by type, with status shown as border color.'
            }
          </p>
        </div>

        {/* Job Types or Drivers */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">
            {isDriverMode ? 'Drivers (fill colors)' : 'Job Types (fill colors)'}
          </h4>
          <div className="grid grid-cols-1 gap-1.5">
            {isDriverMode ? (
              availableDrivers.map((driver) => (
                <div key={driver.id} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: getDriverColor(driver.id, availableDrivers) }}
                  />
                  <span className="text-xs text-gray-700">
                    {driver.first_name} {driver.last_name}
                  </span>
                </div>
              ))
            ) : (
              jobTypes.map((type) => (
                <div key={type.key} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-white shadow-sm"
                    style={{ backgroundColor: type.color }}
                  />
                  <span className="text-xs text-gray-700">{type.label}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Job Statuses */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Job Status (border colors)</h4>
          <div className="grid grid-cols-1 gap-1.5">
            {jobStatuses.map((status) => (
              <div key={status.key} className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  <div 
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: status.color }}
                  />
                </div>
                <span className="text-xs text-gray-700">{status.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clusters */}
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Multiple Jobs</h4>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-semibold">
              3
            </div>
            <span className="text-xs text-gray-700">Click to expand individual jobs</span>
          </div>
        </div>

        {/* Job Count */}
        <div className="pt-2 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Jobs visible:</span>
            <Badge variant="secondary" className="text-xs">
              {filteredJobsCount}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};