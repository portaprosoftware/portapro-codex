import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, AlertTriangle, User, Package } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ConsumableRequest {
  id: string;
  consumable_id: string;
  requested_quantity: number;
  urgency_level: string;
  status: string;
  notes?: string;
  requested_by_name: string;
  job_reference?: string;
  created_at: string;
  updated_at: string;
  processed_by?: string;
  processed_at?: string;
  consumables?: {
    name: string;
    sku?: string;
    on_hand_qty: number;
  };
}

export const ConsumableRequestsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const queryClient = useQueryClient();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['consumable-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_consumable_requests' as any)
        .select(`
          *,
          consumables:consumable_id (
            name,
            sku,
            on_hand_qty
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as ConsumableRequest[];
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, status, processedBy }: { id: string; status: string; processedBy?: string }) => {
      const updateData: any = { 
        status,
        processed_at: new Date().toISOString()
      };
      
      if (processedBy) {
        updateData.processed_by = processedBy;
      }

      const { error } = await supabase
        .from('qr_consumable_requests' as any)
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumable-requests'] });
      toast.success('Request updated successfully');
    },
    onError: () => {
      toast.error('Failed to update request');
    }
  });

  const handleApprove = (request: ConsumableRequest) => {
    updateRequestMutation.mutate({ 
      id: request.id, 
      status: 'approved',
      processedBy: 'Current User' // In real app, get from auth context
    });
  };

  const handleReject = (request: ConsumableRequest) => {
    updateRequestMutation.mutate({ 
      id: request.id, 
      status: 'rejected',
      processedBy: 'Current User'
    });
  };

  const handleFulfill = (request: ConsumableRequest) => {
    updateRequestMutation.mutate({ 
      id: request.id, 
      status: 'fulfilled',
      processedBy: 'Current User'
    });
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const pendingRequests = requests?.filter(r => r.status === 'pending') || [];
  const approvedRequests = requests?.filter(r => r.status === 'approved') || [];
  const fulfilledRequests = requests?.filter(r => r.status === 'fulfilled') || [];
  const rejectedRequests = requests?.filter(r => r.status === 'rejected') || [];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'normal': return 'outline';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      case 'high': return <Clock className="w-4 h-4" />;
      default: return null;
    }
  };

  const RequestCard: React.FC<{ request: ConsumableRequest }> = ({ request }) => (
    <Card key={request.id} className="mb-4">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="font-medium">{request.consumables?.name || 'Unknown Item'}</span>
              {request.consumables?.sku && (
                <Badge variant="outline" className="text-xs">{request.consumables.sku}</Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-3 h-3" />
              <span>Requested by: {request.requested_by_name}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={getUrgencyColor(request.urgency_level)} className="flex items-center gap-1">
              {getUrgencyIcon(request.urgency_level)}
              {request.urgency_level}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
          <div>
            <span className="text-muted-foreground">Quantity:</span>
            <span className="ml-2 font-medium">{request.requested_quantity}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Available:</span>
            <span className="ml-2 font-medium">{request.consumables?.on_hand_qty || 0}</span>
          </div>
          {request.job_reference && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Job:</span>
              <span className="ml-2 font-medium">{request.job_reference}</span>
            </div>
          )}
        </div>

        {request.notes && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm">{request.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {new Date(request.created_at).toLocaleDateString()} at {new Date(request.created_at).toLocaleTimeString()}
          </span>
          
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => handleReject(request)}
                disabled={updateRequestMutation.isPending}
              >
                <XCircle className="w-3 h-3 mr-1" />
                Reject
              </Button>
              <Button 
                size="sm" 
                onClick={() => handleApprove(request)}
                disabled={updateRequestMutation.isPending}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Approve
              </Button>
            </div>
          )}

          {request.status === 'approved' && (
            <Button 
              size="sm" 
              onClick={() => handleFulfill(request)}
              disabled={updateRequestMutation.isPending}
            >
              <Package className="w-3 h-3 mr-1" />
              Mark Fulfilled
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Consumable Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending">
                Pending ({pendingRequests.length})
              </TabsTrigger>
              <TabsTrigger value="approved">
                Approved ({approvedRequests.length})
              </TabsTrigger>
              <TabsTrigger value="fulfilled">
                Fulfilled ({fulfilledRequests.length})
              </TabsTrigger>
              <TabsTrigger value="rejected">
                Rejected ({rejectedRequests.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-6">
              {pendingRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No pending requests</p>
              ) : (
                <div>
                  {pendingRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="approved" className="mt-6">
              {approvedRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No approved requests</p>
              ) : (
                <div>
                  {approvedRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="fulfilled" className="mt-6">
              {fulfilledRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No fulfilled requests</p>
              ) : (
                <div>
                  {fulfilledRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              {rejectedRequests.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No rejected requests</p>
              ) : (
                <div>
                  {rejectedRequests.map(request => (
                    <RequestCard key={request.id} request={request} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};