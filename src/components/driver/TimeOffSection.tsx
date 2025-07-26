import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@clerk/clerk-react';
import { Calendar, Plus, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

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

  const createTimeOffMutation = useMutation({
    mutationFn: async (newRequest: { start_time: string; end_time: string; reason: string }) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('driver_time_off_requests')
        .insert({
          driver_id: user.id,
          request_date: new Date().toISOString().split('T')[0],
          start_time: newRequest.start_time,
          end_time: newRequest.end_time,
          reason: newRequest.reason,
          status: 'pending',
          time_slot: 'full_day'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-time-off'] });
      toast.success('Time off request submitted successfully');
      setIsModalOpen(false);
      setStartDate('');
      setEndDate('');
      setReason('');
    },
    onError: (error) => {
      console.error('Error creating time off request:', error);
      toast.error('Failed to submit time off request');
    }
  });

  const handleSubmitRequest = () => {
    if (!startDate || !endDate || !reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    createTimeOffMutation.mutate({
      start_time: startDate,
      end_time: endDate,
      reason: reason.trim()
    });
  };

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
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary text-white">
                <Plus className="w-4 h-4 mr-2" />
                Request Time Off
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Time Off</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      min={startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea
                    id="reason"
                    placeholder="Please provide a reason for your time off request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmitRequest}
                    disabled={createTimeOffMutation.isPending}
                    className="bg-gradient-primary text-white"
                  >
                    {createTimeOffMutation.isPending ? 'Submitting...' : 'Submit Request'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
    </Card>
  );
};