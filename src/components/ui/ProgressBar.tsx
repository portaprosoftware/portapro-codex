
import React from 'react';

interface ProgressBarProps {
  overdue: number;
  expiring: number;
  total: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  overdue, 
  expiring, 
  total 
}) => {
  if (total === 0) return null;

  const overduePercentage = (overdue / total) * 100;
  const expiringPercentage = (expiring / total) * 100;

  return (
    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full flex">
        <div 
          className="bg-red-500 h-full"
          style={{ width: `${overduePercentage}%` }}
        />
        <div 
          className="bg-gray-400 h-full"
          style={{ width: `${expiringPercentage}%` }}
        />
      </div>
    </div>
  );
};
