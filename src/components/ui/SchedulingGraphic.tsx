import React from 'react';
import { Users, Clock, AlertTriangle } from 'lucide-react';

export const SchedulingGraphic: React.FC = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const drivers = ['Mike R.', 'Sarah K.', 'John D.'];
  const shifts = ['AM', 'PM', 'EVE'];

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Weekly Schedule</h4>
        </div>
        <div className="text-xs text-muted-foreground">Dec 11-15, 2023</div>
      </div>

      {/* Schedule Grid */}
      <div className="space-y-3">
        {/* Days Header */}
        <div className="grid grid-cols-6 gap-2">
          <div className="text-xs font-medium text-muted-foreground"></div>
          {days.map(day => (
            <div key={day} className="text-xs font-medium text-center text-muted-foreground py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Driver Rows */}
        {drivers.map((driver, driverIndex) => (
          <div key={driver} className="grid grid-cols-6 gap-2">
            <div className="text-xs font-medium text-muted-foreground py-2 flex items-center">
              {driver}
            </div>
            {days.map((day, dayIndex) => (
              <div key={`${driver}-${day}`} className="relative">
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

                {/* Conflict Indicator */}
                {driverIndex === 1 && dayIndex === 2 && (
                  <div className="absolute -top-1 -right-1">
                    <AlertTriangle className="w-3 h-3 text-amber-500" />
                  </div>
                )}
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
        <div className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-xs text-muted-foreground">Conflict</span>
        </div>
      </div>
    </div>
  );
};