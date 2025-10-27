import React, { useState, useEffect, ReactNode } from 'react';
import { loadChartsLibs } from '@/lib/loaders/charts';

interface ChartWrapperProps {
  children: (Recharts: any) => ReactNode;
  fallback?: ReactNode;
  className?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({ 
  children, 
  fallback,
  className = "flex items-center justify-center h-[300px]"
}) => {
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    loadChartsLibs().then(setRecharts).catch(console.error);
  }, []);

  if (!Recharts) {
    return fallback || (
      <div className={className}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading chart...</p>
        </div>
      </div>
    );
  }

  return <>{children(Recharts)}</>;
};
