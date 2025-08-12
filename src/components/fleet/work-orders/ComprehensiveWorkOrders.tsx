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
import { WorkOrder } from "./types";

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
      const { data, error } = await supabase
        .from("work_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Apply client-side filtering to avoid complex query rebuilds
      let filteredData = data || [];
      
      if (searchTerm) {
        filteredData = filteredData.filter(wo => 
          (wo as any).work_order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          wo.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (selectedAssetType !== 'all') {
        filteredData = filteredData.filter(wo => wo.asset_type === selectedAssetType);
      }
      
      if (selectedPriority !== 'all') {
        filteredData = filteredData.filter(wo => wo.priority === selectedPriority);
      }
      
      if (selectedSource !== 'all') {
        const sourceValue = selectedSource === "pm_schedule" ? "pm" : selectedSource;
        filteredData = filteredData.filter(wo => wo.source === sourceValue);
      }
      
      if (selectedAssignee === 'unassigned') {
        filteredData = filteredData.filter(wo => !wo.assigned_to);
      } else if (selectedAssignee !== 'all') {
        filteredData = filteredData.filter(wo => wo.assigned_to === selectedAssignee);
      }
      
      if (overdueOnly) {
        filteredData = filteredData.filter(wo => wo.due_date && new Date(wo.due_date) < new Date());
      }
      
      if (oosOnly) {
        filteredData = filteredData.filter(wo => (wo as any).out_of_service === true);
      }

      // Transform data to include asset names and assignee names
      return filteredData.map((wo: any) => ({
        ...wo,
        work_order_number: wo.work_order_number || `WO-${wo.id?.slice(-8)}`,
        asset_name: wo.asset_id || 'Unknown Asset',
        assignee_name: wo.assigned_to || null
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  });

  // Status change mutation
  const statusChangeMutation = useMutation({
    mutationFn: async ({ workOrderId, newStatus }: { workOrderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from('work_orders')
        .update({ 
          status: newStatus as "open" | "awaiting_parts" | "in_progress" | "vendor" | "on_hold" | "ready_for_verification" | "completed",
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
            workOrders={workOrders as any || []}
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