import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';

interface InvitationStatusBadgeProps {
  status: 'pending' | 'accepted' | 'failed' | 'expired';
  className?: string;
}

export const InvitationStatusBadge: React.FC<InvitationStatusBadgeProps> = ({ 
  status, 
  className 
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          variant: 'secondary' as const,
          icon: Clock,
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        };
      case 'accepted':
        return {
          variant: 'default' as const,
          icon: CheckCircle,
          label: 'Accepted',
          className: 'bg-green-100 text-green-800 border-green-200'
        };
      case 'failed':
        return {
          variant: 'destructive' as const,
          icon: XCircle,
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        };
      case 'expired':
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Expired',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
      default:
        return {
          variant: 'outline' as const,
          icon: AlertCircle,
          label: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 ${config.className} ${className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  );
};