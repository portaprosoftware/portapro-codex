import React, { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TechnicianHeader } from '@/components/technician/TechnicianHeader';
import { TechnicianWorkOrderCard } from '@/components/technician/TechnicianWorkOrderCard';
import { TechnicianStats } from '@/components/technician/TechnicianStats';
import { Loader2, Wrench } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const TechnicianDashboard: React.FC = () => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<'assigned' | 'in_progress' | 'completed'>('assigned');

  // Fetch work orders assigned to current user
  const { data: workOrders, isLoading, refetch } = useQuery({
    queryKey: ['technician-work-orders', user?.id, activeTab],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('work_orders')
        .select('*')
        .eq('assigned_to', user.id)
        .order('due_date', { ascending: true });

      // Filter by status based on active tab
      if (activeTab === 'assigned') {
        query = query.in('status', ['open', 'awaiting_parts']);
      } else if (activeTab === 'in_progress') {
        query = query.eq('status', 'in_progress');
      } else if (activeTab === 'completed') {
        query = query.eq('status', 'completed');
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 1 * 60 * 1000, // 1 minute - refresh frequently for field work
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Mobile Header */}
      <TechnicianHeader userName={user?.firstName || 'Technician'} onRefresh={refetch} />

      {/* Stats Cards */}
      <div className="px-4 py-4">
        <TechnicianStats workOrders={workOrders || []} />
      </div>

      {/* Tabs for Status Filter */}
      <div className="px-4 pb-4">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger value="assigned" className="text-base">
              To Do
            </TabsTrigger>
            <TabsTrigger value="in_progress" className="text-base">
              Active
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-base">
              Done
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Work Orders List */}
      <div className="px-4 space-y-4">
        {!workOrders || workOrders.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No work orders
            </h3>
            <p className="text-muted-foreground">
              {activeTab === 'assigned' && "You don't have any pending work orders"}
              {activeTab === 'in_progress' && "No work orders in progress"}
              {activeTab === 'completed' && "No completed work orders"}
            </p>
          </div>
        ) : (
          workOrders.map((workOrder) => (
            <TechnicianWorkOrderCard
              key={workOrder.id}
              workOrder={workOrder}
              onRefresh={refetch}
            />
          ))
        )}
      </div>
    </div>
  );
};
