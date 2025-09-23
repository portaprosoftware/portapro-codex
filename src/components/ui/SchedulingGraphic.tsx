import React from 'react';
import { Users, Clock, AlertTriangle } from 'lucide-react';

export const SchedulingGraphic: React.FC = () => {
  // Generate the next 3 days starting from today
  const generateNext3Days = () => {
    const today = new Date();
    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 3; i++) {
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

  const next3Days = generateNext3Days();
  const drivers = ['Mike R.', 'Sarah K.'];
  const shifts = ['AM', 'PM', 'EVE'];

  // Format date range for header
  const formatDateRange = () => {
    const startDate = next3Days[0].fullDate;
    const endDate = next3Days[2].fullDate;
    const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    const year = endDate.getFullYear();
    
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay}-${endDay}, ${year}`;
    } else {
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
  };

  return (
    <div className="w-[90%] mx-auto bg-white rounded-xl p-3 border shadow-sm">
      {/* Header */}
      <div className="mb-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground text-base">Schedule</h4>
        </div>
        <div className="text-sm text-muted-foreground mt-1">{formatDateRange()}</div>
      </div>

      {/* Schedule Grid */}
      <div className="space-y-2">
        {/* Days Header */}
        <div className="grid grid-cols-4 gap-1">
          <div className="text-sm font-medium text-muted-foreground"></div>
          {next3Days.map((day, index) => (
            <div key={index} className="text-sm font-medium text-center text-muted-foreground py-1">
              <div>{day.fullDate.toLocaleDateString('en-US', { month: 'short' })} {day.date}</div>
            </div>
          ))}
        </div>

        {/* Driver Rows */}
        {drivers.map((driver, driverIndex) => (
          <div key={driver} className="grid grid-cols-4 gap-1">
            <div className="text-sm font-medium text-muted-foreground py-1 flex items-center">
              {driver}
            </div>
            {next3Days.map((day, dayIndex) => (
              <div key={`${driver}-${dayIndex}`} className="relative">
                {/* Morning Shift */}
                <div className={`h-4 rounded-sm mb-0.5 flex items-center justify-center ${
                  (driverIndex === 0 && dayIndex < 2) || (driverIndex === 1 && dayIndex >= 1)
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600'
                    : 'bg-gray-200'
                }`}>
                  {((driverIndex === 0 && dayIndex < 2) || (driverIndex === 1 && dayIndex >= 1)) && (
                    <span className="text-[9px] text-white font-medium">AM</span>
                  )}
                </div>
                
                {/* Afternoon Shift */}
                <div className={`h-4 rounded-sm mb-0.5 flex items-center justify-center ${
                  (driverIndex === 1 && dayIndex < 1) || (driverIndex === 0 && dayIndex === 2)
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                    : 'bg-gray-200'
                }`}>
                  {((driverIndex === 1 && dayIndex < 1) || (driverIndex === 0 && dayIndex === 2)) && (
                    <span className="text-[9px] text-white font-medium">PM</span>
                  )}
                </div>

                {/* Evening Shift */}
                <div className={`h-4 rounded-sm flex items-center justify-center ${
                  (driverIndex === 0 && dayIndex === 1)
                    ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                    : 'bg-gray-200'
                }`}>
                  {(driverIndex === 0 && dayIndex === 1) && (
                    <span className="text-[9px] text-white font-medium">EVE</span>
                  )}
                </div>

              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-gradient-to-r from-blue-500 to-blue-600"></div>
            <span className="text-xs text-muted-foreground">Morning</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-gradient-to-r from-emerald-500 to-emerald-600"></div>
            <span className="text-xs text-muted-foreground">Afternoon</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded bg-gradient-to-r from-purple-500 to-purple-600"></div>
            <span className="text-xs text-muted-foreground">Evening</span>
          </div>
        </div>
      </div>
    </div>
  );
};