
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Briefcase, DollarSign, Users, Truck } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

interface ActivityFeedProps {
  dateRange: { from: Date; to: Date };
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ dateRange }) => {
  const { data: activities, isLoading } = useQuery({
    queryKey: ['recent-activities', dateRange],
    queryFn: async () => {
      // Fetch recent jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_type, status, created_at, customers(name)')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, amount, status, created_at, customers(name)')
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'))
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort activities
      const allActivities = [
        ...(jobs || []).map(job => ({
          id: job.id,
          type: 'job',
          title: `New ${job.job_type} job`,
          description: `Customer: ${job.customers?.name || 'Unknown'}`,
          status: job.status,
          timestamp: job.created_at,
          icon: Briefcase
        })),
        ...(invoices || []).map(invoice => ({
          id: invoice.id,
          type: 'invoice',
          title: `Invoice ${invoice.status}`,
          description: `$${invoice.amount.toLocaleString()} - ${invoice.customers?.name || 'Unknown'}`,
          status: invoice.status,
          timestamp: invoice.created_at,
          icon: DollarSign
        }))
      ];

      return allActivities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'paid':
        return 'bg-gradient-to-r from-green-500 to-green-600 text-white font-bold';
      case 'assigned':
      case 'unpaid':
        return 'bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold';
      case 'in_progress':
        return 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-500 to-red-600 text-white font-bold';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold';
    }
  };

  const capitalizeStatus = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (isLoading) {
    return (
      <Card className="p-6 rounded-2xl shadow-md border-l-4 border-green-500">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl shadow-md border-l-4 border-green-500">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-4 max-h-80 overflow-y-auto">
        {activities?.map((activity) => {
          const IconComponent = activity.icon;
          return (
            <div key={`${activity.type}-${activity.id}`} className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                <IconComponent className="w-4 h-4 text-gray-600" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {activity.title}
                  </p>
                  <Badge
                    className={`text-xs ${getStatusColor(activity.status)}`}
                    variant="secondary"
                  >
                    {capitalizeStatus(activity.status)}
                  </Badge>
                </div>
                
                <p className="text-xs text-gray-500 truncate mt-1">
                  {activity.description}
                </p>
                
                <p className="text-xs text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          );
        })}
        
        {(!activities || activities.length === 0) && (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        )}
      </div>
    </Card>
  );
};
