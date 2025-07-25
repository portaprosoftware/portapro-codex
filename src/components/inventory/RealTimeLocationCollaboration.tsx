import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StorageLocationSelector } from '@/components/inventory/StorageLocationSelector';
import { 
  Users, 
  MapPin, 
  Clock, 
  Activity, 
  RefreshCw,
  Package,
  ArrowRightLeft,
  Plus,
  Minus
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface UserActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_initials: string;
  activity_type: 'stock_adjustment' | 'transfer' | 'receiving' | 'job_assignment';
  description: string;
  location_id?: string;
  location_name?: string;
  timestamp: string;
  metadata?: any;
}

interface ActiveUser {
  user_id: string;
  user_name: string;
  user_initials: string;
  current_location_id?: string;
  current_location_name?: string;
  last_activity: string;
  status: 'active' | 'idle' | 'away';
}

export const RealTimeLocationCollaboration: React.FC = () => {
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [isConnected, setIsConnected] = useState(false);

  // Real-time activity feed
  const { data: activities, refetch: refetchActivities } = useQuery({
    queryKey: ['location-activities', selectedLocationId],
    queryFn: async () => {
      let query = supabase
        .from('consumable_stock_adjustments')
        .select(`
          id,
          created_at,
          adjustment_type,
          quantity_change,
          reason,
          notes,
          consumables(name, category),
          adjusted_by
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: adjustments, error } = await query;
      if (error) throw error;

      // Transform into activity format (simplified for demo)
      const activities: UserActivity[] = adjustments?.map((adj, index) => ({
        id: adj.id,
        user_id: adj.adjusted_by || 'system',
        user_name: `User ${index + 1}`, // In real app, would join with profiles
        user_initials: `U${index + 1}`,
        activity_type: adj.adjustment_type as any || 'stock_adjustment',
        description: `${adj.adjustment_type}: ${adj.quantity_change > 0 ? '+' : ''}${adj.quantity_change} ${adj.consumables?.name}`,
        timestamp: adj.created_at,
        metadata: {
          reason: adj.reason,
          notes: adj.notes,
          category: adj.consumables?.category
        }
      })) || [];

      return activities;
    },
    refetchInterval: 5000 // Refresh every 5 seconds for real-time feel
  });

  // Active users simulation (in real app would use Supabase Realtime presence)
  const { data: activeUsers, refetch: refetchUsers } = useQuery({
    queryKey: ['active-users', selectedLocationId],
    queryFn: async () => {
      // Simulate active users - in real app would track user presence
      const mockUsers: ActiveUser[] = [
        {
          user_id: '1',
          user_name: 'Sarah Johnson',
          user_initials: 'SJ',
          current_location_id: 'loc1',
          current_location_name: 'Main Warehouse',
          last_activity: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
          status: 'active'
        },
        {
          user_id: '2',
          user_name: 'Mike Chen',
          user_initials: 'MC',
          current_location_id: 'loc2',
          current_location_name: 'Field Office',
          last_activity: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 min ago
          status: 'idle'
        },
        {
          user_id: '3',
          user_name: 'Emma Davis',
          user_initials: 'ED',
          current_location_id: 'loc1',
          current_location_name: 'Main Warehouse',
          last_activity: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
          status: 'active'
        }
      ];

      // Filter by location if selected
      if (selectedLocationId !== 'all') {
        return mockUsers.filter(user => user.current_location_id === selectedLocationId);
      }

      return mockUsers;
    },
    refetchInterval: 10000 // Refresh every 10 seconds
  });

  // Set up real-time subscription (simplified simulation)
  useEffect(() => {
    setIsConnected(true);
    
    // In real app, would set up Supabase realtime subscription
    const interval = setInterval(() => {
      refetchActivities();
      refetchUsers();
    }, 5000);

    return () => {
      clearInterval(interval);
      setIsConnected(false);
    };
  }, [selectedLocationId]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'transfer_in':
      case 'transfer_out':
        return <ArrowRightLeft className="w-4 h-4 text-blue-500" />;
      case 'received':
        return <Plus className="w-4 h-4 text-green-500" />;
      case 'adjustment':
        return <RefreshCw className="w-4 h-4 text-orange-500" />;
      case 'used':
        return <Minus className="w-4 h-4 text-red-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'idle':
        return 'bg-yellow-500';
      case 'away':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isConnected ? 'Real-time connected' : 'Disconnected'}
              </span>
            </div>
            
            <StorageLocationSelector
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              includeAllSites={true}
              placeholder="Filter by location"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Active Users
              {activeUsers && (
                <Badge variant="outline">{activeUsers.length} online</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {activeUsers?.map((user) => (
                  <div key={user.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="relative">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">{user.user_initials}</AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.status)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">{user.user_name}</span>
                        <Badge variant="outline" className="text-xs">{user.status}</Badge>
                      </div>
                      
                      {user.current_location_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {user.current_location_name}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(user.last_activity), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {(!activeUsers || activeUsers.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No active users at this location</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Recent Activity
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  refetchActivities();
                  refetchUsers();
                }}
                className="ml-auto"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <div className="mt-1">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{activity.user_name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      
                      {activity.location_name && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="w-3 h-3" />
                          {activity.location_name}
                        </div>
                      )}
                      
                      {activity.metadata?.category && (
                        <Badge variant="outline" className="text-xs mt-1">
                          {activity.metadata.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!activities || activities.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">No recent activity</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};