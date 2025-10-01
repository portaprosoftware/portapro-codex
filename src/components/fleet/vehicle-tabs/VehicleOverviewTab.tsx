import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useVehicleMetrics } from '@/hooks/vehicle/useVehicleMetrics';
import { useVehicleActivity } from '@/hooks/vehicle/useVehicleActivity';
import { 
  Wrench, 
  FileText, 
  AlertTriangle, 
  Calendar, 
  Clock,
  ExternalLink 
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface VehicleOverviewTabProps {
  vehicleId: string;
  licensePlate: string;
}

export function VehicleOverviewTab({ vehicleId, licensePlate }: VehicleOverviewTabProps) {
  const navigate = useNavigate();
  const { data: metrics, isLoading: metricsLoading } = useVehicleMetrics(vehicleId);
  const { data: activity, isLoading: activityLoading } = useVehicleActivity(vehicleId, 10);

  const quickStats = [
    {
      label: 'Open Work Orders',
      value: metrics?.open_work_orders || 0,
      icon: Wrench,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-700',
    },
    {
      label: 'DVIRs (30d)',
      value: metrics?.dvirs_last_30d || 0,
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: 'Incidents (30d)',
      value: metrics?.incidents_last_30d || 0,
      icon: AlertTriangle,
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: 'Docs Expiring',
      value: metrics?.docs_expiring_30d || 0,
      icon: Calendar,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'work_order':
        return Wrench;
      case 'dvir':
        return FileText;
      case 'incident':
        return AlertTriangle;
      case 'fuel':
        return Clock;
      default:
        return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-2 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-3xl font-bold", stat.textColor)}>
                      {metricsLoading ? '...' : stat.value}
                    </p>
                  </div>
                  <div className={cn(
                    "p-3 rounded-lg",
                    stat.bgColor
                  )}>
                    <Icon className={cn("w-6 h-6", stat.textColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Last DVIR Status */}
      {metrics?.last_dvir_date && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Last DVIR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(metrics.last_dvir_date), 'MMM d, yyyy h:mm a')}
                </p>
                <Badge className={cn(
                  "mt-2 font-bold",
                  metrics.last_dvir_status === 'pass' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600' 
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                )}>
                  {metrics.last_dvir_status?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="border-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(`/fleet?vehicle_id=${vehicleId}&vehicle_name=${encodeURIComponent(licensePlate)}`)}
            title="View all activity"
          >
            <ExternalLink className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 bg-gray-100 rounded" />
              ))}
            </div>
          ) : activity && activity.length > 0 ? (
            <div className="space-y-3">
              {activity.map((item) => {
                const Icon = getActivityIcon(item.activity_type);
                return (
                  <div
                    key={item.activity_id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-blue-50">
                      <Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.activity_summary}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(item.activity_date), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No recent activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
