import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface VarianceWarningBadgeProps {
  variance: number;
  variancePercent: number;
  tolerance: number;
}

export const VarianceWarningBadge: React.FC<VarianceWarningBadgeProps> = ({
  variance,
  variancePercent,
  tolerance,
}) => {
  const exceedsTolerance = Math.abs(variancePercent) > tolerance;
  const isCritical = Math.abs(variancePercent) > tolerance * 2;

  if (!exceedsTolerance) {
    return (
      <Badge variant="outline" className="gap-1">
        <CheckCircle className="h-3 w-3 text-green-600" />
        <span className="text-green-600">
          Within tolerance ({variance > 0 ? '+' : ''}
          {variance.toFixed(1)} gal, {variancePercent.toFixed(1)}%)
        </span>
      </Badge>
    );
  }

  return (
    <Badge variant={isCritical ? 'destructive' : 'secondary'} className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      <span>
        Variance: {variance > 0 ? '+' : ''}
        {variance.toFixed(1)} gal ({variancePercent.toFixed(1)}%) - Review Required
      </span>
    </Badge>
  );
};
