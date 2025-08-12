import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Kanban, List, Calendar, Eye } from "lucide-react";
import { WorkOrderMetrics } from "./WorkOrderMetrics";
import { WorkOrderFilters } from "./WorkOrderFilters";
import { WorkOrderKanbanBoard } from "./WorkOrderKanbanBoard";
import { AddWorkOrderDrawer } from "./AddWorkOrderDrawer";
import { useToast } from "@/hooks/use-toast";

export const ComprehensiveWorkOrders: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'board' | 'list' | 'calendar'>('board');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [oosOnly, setOosOnly] = useState(false);

  // Fetch work orders with enhanced data
  const { data: workOrders, isLoading, refetch } = useQuery({
    queryKey: ["comprehensive-work-orders", searchTerm, selectedAssetType, selectedPriority, selectedSource, selectedAssignee, overdueOnly, oosOnly],
    queryFn: async () => {
      let query = supabase
        .from("work_orders")
        .select(`
          *,
          vehicles(license_plate, vehicle_type),
          product_items(item_code),
          maintenance_technicians(first_name, last_name)
        `)
        .order("opened_at", { ascending: false });

      // Apply filters
      if (searchTerm) {
        query = query.or(`work_order_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }
      
      if (selectedAssetType !== 'all') {
        query = query.eq('asset_type', selectedAssetType);
      }
      
      if (selectedPriority !== 'all') {
        query = query.eq('priority', selectedPriority);
      }
      
      if (selectedSource !== 'all') {
        query = query.eq('source', selectedSource);
      }
      
      if (selectedAssignee === 'unassigned') {
        query = query.is('assignee_id', null);
      } else if (selectedAssignee !== 'all') {
        query = query.eq('assignee_id', selectedAssignee);
      }
      
      if (overdueOnly) {
        query = query.lt('due_date', new Date().toISOString());
      }
      
      if (oosOnly) {
        query = query.eq('out_of_service', true);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Transform data to include asset names and assignee names
      return (data || []).map(wo => ({
        ...wo,
        asset_name: wo.vehicles?.[0]?.license_plate || wo.product_items?.[0]?.item_code || 'Unknown Asset',
        assignee_name: wo.maintenance_technicians?.[0] 
          ? `${wo.maintenance_technicians[0].first_name} ${wo.maintenance_technicians[0].last_name}`
          : null
      }));
    }
  });

  // Status change mutation
  const statusChangeMutation = useMutation({
    mutationFn: async ({ workOrderId, newStatus }: { workOrderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comprehensive-work-orders"] });
      toast({
        title: "Status updated",
        description: "Work order status has been updated successfully"
      });
    },
    onError: (error) => {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update work order status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (workOrderId: string, newStatus: string) => {
    statusChangeMutation.mutate({ workOrderId, newStatus });
  };

  const handleEdit = (workOrder: any) => {
    console.log('Edit work order:', workOrder);
    // TODO: Implement edit modal
  };

  const handleViewDetails = (workOrder: any) => {
    console.log('View details for work order:', workOrder);
    // TODO: Implement details drawer
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedAssetType !== 'all') count++;
    if (selectedPriority !== 'all') count++;
    if (selectedSource !== 'all') count++;
    if (selectedAssignee !== 'all') count++;
    if (overdueOnly) count++;
    if (oosOnly) count++;
    return count;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedAssetType('all');
    setSelectedPriority('all');
    setSelectedSource('all');
    setSelectedAssignee('all');
    setOverdueOnly(false);
    setOosOnly(false);
  };

  const handleBulkAssign = () => {
    console.log('Bulk assign');
    // TODO: Implement bulk assignment
  };

  const handleExport = () => {
    console.log('Export work orders');
    // TODO: Implement export functionality
  };

  if (isLoading) {
    return <div className="p-6 text-center">Loading work orders...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Work Orders</h2>
          <p className="text-sm text-muted-foreground">
            Manage maintenance work orders across your fleet
          </p>
        </div>
        <Button onClick={() => setIsAddDrawerOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Work Order
        </Button>
      </div>

      {/* Metrics */}
      <WorkOrderMetrics />

      {/* Filters */}
      <WorkOrderFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedAssetType={selectedAssetType}
        onAssetTypeChange={setSelectedAssetType}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        selectedAssignee={selectedAssignee}
        onAssigneeChange={setSelectedAssignee}
        overdueOnly={overdueOnly}
        onOverdueToggle={setOverdueOnly}
        oosOnly={oosOnly}
        onOosToggle={setOosOnly}
        activeFiltersCount={getActiveFiltersCount()}
        onClearFilters={handleClearFilters}
        onBulkAssign={handleBulkAssign}
        onExport={handleExport}
      />

      {/* View Toggle */}
      <Tabs value={view} onValueChange={(value) => setView(value as any)}>
        <TabsList>
          <TabsTrigger value="board" className="flex items-center gap-2">
            <Kanban className="h-4 w-4" />
            Board
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="h-4 w-4" />
            List
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="mt-6">
          <WorkOrderKanbanBoard
            workOrders={workOrders || []}
            onEdit={handleEdit}
            onViewDetails={handleViewDetails}
            onStatusChange={handleStatusChange}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            List view coming soon...
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <div className="text-center py-12 text-muted-foreground">
            Calendar view coming soon...
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Work Order Drawer */}
      <AddWorkOrderDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};