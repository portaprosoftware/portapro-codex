import React from 'react';
import { Users, Clock, AlertTriangle } from 'lucide-react';

export const SchedulingGraphic: React.FC = () => {
  // Generate the next 7 days starting from today
  const generateNext7Days = () => {
    const today = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        name: dayNames[date.getDay()],
        date: date.getDate(),
        fullDate: date
      });
    }
    return days;
  };

  const next7Days = generateNext7Days();
  const drivers = ['Mike R.', 'Sarah K.', 'John D.'];
  const shifts = ['AM', 'PM', 'EVE'];

  // Format date range for header
  const formatDateRange = () => {
    const startDate = next7Days[0].fullDate;
    const endDate = next7Days[6].fullDate;
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    
    const start = startDate.toLocaleDateString('en-US', options);
    const end = endDate.toLocaleDateString('en-US', options);
    const year = endDate.getFullYear();
    
    return `${start} - ${end}, ${year}`;
  };

  return (
    <div className="w-full bg-white rounded-xl p-4 border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Weekly Schedule</h4>
        </div>
        <div className="text-xs text-muted-foreground">{formatDateRange()}</div>
      </div>

      {/* Schedule Grid */}
      <div className="space-y-3">
        {/* Days Header */}
        <div className="grid grid-cols-8 gap-2">
          <div className="text-xs font-medium text-muted-foreground"></div>
          {next7Days.map((day, index) => (
            <div key={index} className="text-xs font-medium text-center text-muted-foreground py-1">
              <div>{day.name}</div>
              <div className="text-[10px] text-gray-500">{day.date}</div>
            </div>
          ))}
        </div>

        {/* Driver Rows */}
        {drivers.map((driver, driverIndex) => (
          <div key={driver} className="grid grid-cols-8 gap-2">
            <div className="text-xs font-medium text-muted-foreground py-2 flex items-center">
              {driver}
            </div>
            {next7Days.map((day, dayIndex) => (
              <div key={`${driver}-${dayIndex}`} className="relative">
                {/* Morning Shift */}
                <div className={`h-4 rounded-sm mb-1 flex items-center justify-center ${
                  (driverIndex === 0 && dayIndex < 3) || (driverIndex === 1 && dayIndex >= 2) || (driverIndex === 2 && dayIndex === 1)
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gray-200'
                }`}>
                  {((driverIndex === 0 && dayIndex < 3) || (driverIndex === 1 && dayIndex >= 2) || (driverIndex === 2 && dayIndex === 1)) && (
                    <span className="text-[8px] text-white font-medium">AM</span>
                  )}
                </div>
                
                {/* Afternoon Shift */}
                <div className={`h-4 rounded-sm mb-1 flex items-center justify-center ${
                  (driverIndex === 1 && dayIndex < 2) || (driverIndex === 2 && dayIndex >= 3) || (driverIndex === 0 && dayIndex === 4)
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gray-200'
                }`}>
                  {((driverIndex === 1 && dayIndex < 2) || (driverIndex === 2 && dayIndex >= 3) || (driverIndex === 0 && dayIndex === 4)) && (
                    <span className="text-[8px] text-white font-medium">PM</span>
                  )}
                </div>

                {/* Evening Shift */}
                <div className={`h-4 rounded-sm flex items-center justify-center ${
                  (driverIndex === 2 && dayIndex === 0) || (driverIndex === 0 && dayIndex === 1)
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : 'bg-gray-200'
                }`}>
                  {((driverIndex === 2 && dayIndex === 0) || (driverIndex === 0 && dayIndex === 1)) && (
                    <span className="text-[8px] text-white font-medium">EVE</span>
                  )}
                </div>

              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span className="text-xs text-muted-foreground">Morning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <span className="text-xs text-muted-foreground">Afternoon</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <span className="text-xs text-muted-foreground">Evening</span>
          </div>
        </div>
      </div>
    </div>
  );
};