
import React from 'react';

interface DonutChartProps {
  active: number;
  maintenance: number;
  size?: number;
}

export const DonutChart: React.FC<DonutChartProps> = ({ 
  active, 
  maintenance, 
  size = 32 
}) => {
  const total = active + maintenance;
  if (total === 0) return null;

  const activePercentage = (active / total) * 100;
  const maintenancePercentage = (maintenance / total) * 100;
  
  const radius = 12;
  const circumference = 2 * Math.PI * radius;
  const activeStrokeDasharray = `${(activePercentage / 100) * circumference} ${circumference}`;
  const maintenanceStrokeDasharray = `${(maintenancePercentage / 100) * circumference} ${circumference}`;
  const maintenanceStrokeDashoffset = -((activePercentage / 100) * circumference);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#f3f4f6"
          strokeWidth="3"
        />
        
        {/* Active segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#33CC66"
          strokeWidth="3"
          strokeDasharray={activeStrokeDasharray}
          strokeLinecap="round"
        />
        
        {/* Maintenance segment */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ef4444"
          strokeWidth="3"
          strokeDasharray={maintenanceStrokeDasharray}
          strokeDashoffset={maintenanceStrokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
