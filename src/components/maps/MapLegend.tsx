import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

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
    delivery: '#3B82F6',       // blue-500
    pickup: '#10B981',         // emerald-500
    partial_pickup: '#F97316', // orange-500
    service: '#8B5CF6',        // violet-500 (changed from amber to match dropdown)
    return: '#8B5CF6',         // violet-500
    cleaning: '#06B6D4',       // cyan-500
    survey_estimate: '#991B1B',    // red-800 (maroon)
    'on-site-survey': '#991B1B',   // red-800 (maroon) - handle both keys
  };
  return colors[jobType] || '#6B7280';
};

// Status border colors
export const getStatusBorderColor = (status: string, isOverdue = false, isPriority = false, isCompletedLate = false) => {
  if (isOverdue) return '#EF4444'; // red-500
  if (isPriority) return '#F59E0B'; // amber-500
  if (isCompletedLate) return '#EA580C'; // orange-600
  
  const colors = {
    assigned: '#3B82F6',        // blue-500
    unassigned: '#6B7280',      // gray-500
    in_progress: '#F97316',     // orange-500
    completed: '#22C55E',       // green-500
    cancelled: '#1F2937',       // gray-800
    rescheduled: '#1E3A8A',     // blue-800
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
    { key: 'partial_pickup', label: 'Partial Pickup', color: getJobTypeColor('partial_pickup') },
    { key: 'service', label: 'Service', color: getJobTypeColor('service') },
    { key: 'survey_estimate', label: 'Survey/Estimate', color: getJobTypeColor('survey_estimate') },
  ];

  const jobStatusesLeft = [
    { key: 'assigned', label: 'Assigned', color: getStatusBorderColor('assigned') },
    { key: 'unassigned', label: 'Unassigned', color: getStatusBorderColor('unassigned') },
    { key: 'in_progress', label: 'In Progress', color: getStatusBorderColor('in_progress') },
    { key: 'completed', label: 'Completed', color: getStatusBorderColor('completed') },
    { key: 'cancelled', label: 'Cancelled', color: getStatusBorderColor('cancelled') },
  ];

  const jobStatusesRight = [
    { key: 'priority', label: 'Priority', color: getStatusBorderColor('', false, true) },
    { key: 'overdue_rescheduled', label: 'Overdue - Rescheduled', color: getStatusBorderColor('rescheduled') },
    { key: 'overdue', label: 'Overdue', color: getStatusBorderColor('', true) },
    { key: 'completed_late', label: 'Job Completed Late', color: getStatusBorderColor('', false, false, true) },
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
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
            {/* Left Column */}
            {jobStatusesLeft.map((status) => (
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
            {/* Right Column */}
            {jobStatusesRight.map((status) => (
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
          <div className="flex items-center gap-3">
            {/* Show examples: 2, 3, 4, + */}
            {[2, 3, 4].map((num) => (
              <div key={num} className="flex items-center gap-1">
                <div className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                  {num}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center">
                <Plus className="w-3 h-3" />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-1">Click to expand individual jobs</p>
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