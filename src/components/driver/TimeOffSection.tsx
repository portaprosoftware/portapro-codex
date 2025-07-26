import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { MobileTimeOffRequestSlider } from './MobileTimeOffRequestSlider';

interface TimeOffRequest {
  id: string;
  request_date: string;
  start_time: string;
  end_time: string;
  reason: string;
  status: string;
  created_at: string;
  time_slot: string;
}

export const TimeOffSection: React.FC = () => {
  const { user } = useUser();
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  const { data: timeOffRequests, isLoading } = useQuery({
    queryKey: ['driver-time-off', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('driver_time_off_requests')
        .select('*')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TimeOffRequest[];
    },
    enabled: !!user?.id
  });


  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'warning' as const, icon: Clock },
      approved: { variant: 'success' as const, icon: CheckCircle },
      denied: { variant: 'destructive' as const, icon: XCircle }
    };
    
    const config = variants[status as keyof typeof variants] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="text-white">
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Time Off</span>
          </CardTitle>
          
          <Button 
            size="sm" 
            className="bg-gradient-primary text-white"
            onClick={() => setIsSliderOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Request Time Off
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-24">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : timeOffRequests && timeOffRequests.length > 0 ? (
          <div className="space-y-3">
            {timeOffRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm font-medium">
                      {format(new Date(request.start_time), 'MMM d')} - {format(new Date(request.end_time), 'MMM d, yyyy')}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <p className="text-sm text-gray-600">{request.reason}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No time off requests yet</p>
          </div>
        )}
      </CardContent>
      
      <MobileTimeOffRequestSlider 
        isOpen={isSliderOpen}
        onClose={() => setIsSliderOpen(false)}
      />
    </Card>
  );
};