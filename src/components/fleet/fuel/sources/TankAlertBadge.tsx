import React from 'react';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AlertSeverity } from '@/types/fuel';

interface TankAlertBadgeProps {
  severity: AlertSeverity;
  count?: number;
}

export const TankAlertBadge: React.FC<TankAlertBadgeProps> = ({ severity, count }) => {
  const config = {
    critical: {
      icon: AlertCircle,
      className: 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0',
      label: 'Critical',
    },
    high: {
      icon: AlertTriangle,
      className: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0',
      label: 'High',
    },
    medium: {
      icon: AlertTriangle,
      className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0',
      label: 'Medium',
    },
    low: {
      icon: Info,
      className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0',
      label: 'Low',
    },
  };

  const { icon: Icon, className, label } = config[severity];

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
      {count !== undefined && count > 1 && ` (${count})`}
    </Badge>
  );
};
