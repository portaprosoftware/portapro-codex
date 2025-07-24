import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, MessageSquare, Activity, MapPin, Clock, Package } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

interface ActivityItem {
  id: string;
  activity_type: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  user_name?: string;
  description: string;
  metadata: any;
  created_at: string;
}

interface StockTransfer {
  id: string;
  transfer_number: string;
  from_location_id: string;
  to_location_id: string;
  consumable_id: string;
  quantity: number;
  status: string;
  requested_by?: string;
  notes?: string;
  created_at: string;
  warehouse_locations_from?: { location_name: string };
  warehouse_locations_to?: { location_name: string };
  consumables?: { name: string };
}

interface WarehouseLocation {
  id: string;
  location_name: string;
  location_code: string;
  address?: string;
  is_primary: boolean;
  manager_id?: string;
}

export const RealTimeCollaborationSystem: React.FC = () => {
  const [activeUsers, setActiveUsers] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  
  const queryClient = useQueryClient();

  // Real-time activities
  const { data: activities, isLoading: activitiesLoading } = useQuery({
    queryKey: ['consumable-activities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_activities' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []) as unknown as ActivityItem[];
    }
  });

  // Stock transfers
  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['stock-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_transfers' as any)
        .select(`
          *,
          warehouse_locations_from:from_location_id (location_name),
          warehouse_locations_to:to_location_id (location_name),
          consumables:consumable_id (name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as StockTransfer[];
    }
  });

  // Warehouse locations
  const { data: locations } = useQuery({
    queryKey: ['warehouse-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('warehouse_locations' as any)
        .select('*')
        .order('location_name');
      
      if (error) throw error;
      return (data || []) as unknown as WarehouseLocation[];
    }
  });

  // Set up real-time subscriptions
  useEffect(() => {
    const activitiesChannel = supabase
      .channel('activities-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'consumable_activities' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['consumable-activities'] });
          toast.success(`New activity: ${payload.new.description}`);
        }
      )
      .subscribe();

    const transfersChannel = supabase
      .channel('transfers-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'stock_transfers' },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
          if (payload.eventType === 'INSERT') {
            toast.success('New stock transfer created');
          } else if (payload.eventType === 'UPDATE') {
            toast.success('Stock transfer updated');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(activitiesChannel);
      supabase.removeChannel(transfersChannel);
    };
  }, [queryClient]);

  const updateTransferStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: any = { status };
      
      if (status === 'in_transit') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.received_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('stock_transfers' as any)
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-transfers'] });
      toast.success('Transfer status updated');
    }
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'request': return <MessageSquare className="w-4 h-4" />;
      case 'usage': return <Package className="w-4 h-4" />;
      case 'restock': return <Package className="w-4 h-4" />;
      case 'transfer': return <MapPin className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'request': return 'secondary';
      case 'usage': return 'destructive';
      case 'restock': return 'default';
      case 'transfer': return 'outline';
      default: return 'outline';
    }
  };

  const getTransferStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'in_transit': return 'default';
      case 'completed': return 'success';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (activitiesLoading || transfersLoading) {
    return <LoadingSpinner />;
  }

  const filteredActivities = selectedLocation === 'all' 
    ? activities 
    : activities?.filter(activity => 
        activity.metadata?.location_id === selectedLocation
      );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Real-Time Collaboration & Multi-Location Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="activity" className="space-y-6">
            <TabsList>
              <TabsTrigger value="activity">Live Activity Feed</TabsTrigger>
              <TabsTrigger value="transfers">Stock Transfers</TabsTrigger>
              <TabsTrigger value="locations">Location Management</TabsTrigger>
              <TabsTrigger value="team">Team Collaboration</TabsTrigger>
            </TabsList>

            <TabsContent value="activity" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Real-Time Activity Feed</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-muted-foreground">Live</span>
                  </div>
                  <Badge variant="outline">{filteredActivities?.length || 0} events</Badge>
                </div>
              </div>

              <ScrollArea className="h-[400px] w-full border rounded-lg p-4">
                <div className="space-y-3">
                  {filteredActivities?.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No recent activity</p>
                      <p className="text-sm">Activity will appear here in real-time</p>
                    </div>
                  ) : (
                    filteredActivities?.map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <div className="flex-shrink-0">
                          <Badge variant={getActivityColor(activity.activity_type) as any} className="flex items-center gap-1">
                            {getActivityIcon(activity.activity_type)}
                            <span className="capitalize">{activity.activity_type}</span>
                          </Badge>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm">{activity.description}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {activity.user_name && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {activity.user_name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(activity.created_at).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="transfers" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Stock Transfers</h3>
                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  New Transfer
                </Button>
              </div>

              <div className="space-y-3">
                {transfers?.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No stock transfers</p>
                      <p className="text-sm">Create transfers to move inventory between locations</p>
                    </CardContent>
                  </Card>
                ) : (
                  transfers?.map(transfer => (
                    <Card key={transfer.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <div className="flex items-center gap-3">
                              <h4 className="font-medium">{transfer.transfer_number}</h4>
                              <Badge variant={getTransferStatusColor(transfer.status) as any} className="capitalize">
                                {transfer.status}
                              </Badge>
                            </div>
                            
                            <div className="text-sm space-y-1">
                              <p>
                                <span className="text-muted-foreground">Item:</span> {transfer.consumables?.name}
                              </p>
                              <p>
                                <span className="text-muted-foreground">Quantity:</span> {transfer.quantity}
                              </p>
                              <p>
                                <span className="text-muted-foreground">From:</span> {transfer.warehouse_locations_from?.location_name} 
                                <span className="mx-2">→</span>
                                <span className="text-muted-foreground">To:</span> {transfer.warehouse_locations_to?.location_name}
                              </p>
                              {transfer.notes && (
                                <p className="text-muted-foreground italic">{transfer.notes}</p>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground">
                              Created {new Date(transfer.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          {transfer.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                onClick={() => updateTransferStatus.mutate({ id: transfer.id, status: 'in_transit' })}
                                disabled={updateTransferStatus.isPending}
                              >
                                Ship
                              </Button>
                            </div>
                          )}

                          {transfer.status === 'in_transit' && (
                            <Button 
                              size="sm"
                              onClick={() => updateTransferStatus.mutate({ id: transfer.id, status: 'completed' })}
                              disabled={updateTransferStatus.isPending}
                            >
                              Mark Received
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="locations" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Warehouse Locations</h3>
                <Button>
                  <MapPin className="w-4 h-4 mr-2" />
                  Add Location
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {locations?.map(location => (
                  <Card key={location.id}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{location.location_name}</h4>
                          {location.is_primary && (
                            <Badge variant="default">Primary</Badge>
                          )}
                        </div>
                        
                        <div className="text-sm space-y-1">
                          <p><span className="text-muted-foreground">Code:</span> {location.location_code}</p>
                          {location.address && (
                            <p><span className="text-muted-foreground">Address:</span> {location.address}</p>
                          )}
                        </div>

                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Active Transfers: 2</span>
                          <span>Capacity: 85%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="team" className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">Real-time team coordination and communication</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Active Team Members</h4>
                    <div className="space-y-3">
                      {['John Smith', 'Sarah Johnson', 'Mike Wilson', 'Emily Chen'].map((name, idx) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-medium">{name}</p>
                              <p className="text-xs text-muted-foreground">
                                {idx === 0 ? 'Warehouse Manager' : idx === 1 ? 'Inventory Coordinator' : 'Field Technician'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs text-muted-foreground">Online</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-4">Recent Notifications</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">Toilet Paper stock running low at Main Warehouse</p>
                        <p className="text-xs text-muted-foreground">5 minutes ago</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">Transfer #TF-001 completed successfully</p>
                        <p className="text-xs text-muted-foreground">15 minutes ago</p>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">New consumable request from Job #J-456</p>
                        <p className="text-xs text-muted-foreground">23 minutes ago</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};