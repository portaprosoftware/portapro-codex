import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Kanban, List, Calendar, Eye, FileDown, FileText, BarChart3 } from "lucide-react";
import { WorkOrderMetrics } from "./WorkOrderMetrics";
import { WorkOrderFilters } from "./WorkOrderFilters";
import { WorkOrderKanbanBoard } from "./WorkOrderKanbanBoard";
import { WorkOrderListView } from "./WorkOrderListView";
import { WorkOrderCalendarViewEnhanced } from "./WorkOrderCalendarViewEnhanced";
import { WorkOrderAnalyticsDashboard } from "./analytics/WorkOrderAnalyticsDashboard";
import { AddWorkOrderDrawer } from "./AddWorkOrderDrawer";
import { WorkOrderDetailDrawer } from "./WorkOrderDetailDrawer";
import { BulkActionsDialog } from "./BulkActionsDialog";
import { BulkActionBar } from "./BulkActionBar";
import { useToast } from "@/hooks/use-toast";
import { WorkOrder } from "./types";
import { canMoveToStatus, getStatusTransitionMessage } from "@/lib/workOrderRules";
import { exportWorkOrderToPDF } from "@/lib/workOrderExport";
import { exportWorkOrdersToCSV } from "@/utils/workOrderExport";
import { useBulkWorkOrderActions } from "@/hooks/workOrders/useBulkWorkOrderActions";
import { triggerWorkOrderStatusChangeNotification } from "@/utils/notificationTriggers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MultiSelectVehicleFilter } from "../MultiSelectVehicleFilter";

interface ComprehensiveWorkOrdersProps {
  vehicleId?: string;
  licensePlate?: string;
}

export const ComprehensiveWorkOrders: React.FC<ComprehensiveWorkOrdersProps> = ({ vehicleId, licensePlate }) => {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  const [view, setView] = useState<'board' | 'list' | 'calendar' | 'analytics'>('board');
  const [isAddDrawerOpen, setIsAddDrawerOpen] = useState(false);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAssetType, setSelectedAssetType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedAssignee, setSelectedAssignee] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [oosOnly, setOosOnly] = useState(false);

  // Selection state
  const [selectedWorkOrderIds, setSelectedWorkOrderIds] = useState<string[]>([]);
  const [bulkActionDialog, setBulkActionDialog] = useState<{
    open: boolean;
    action: 'status' | 'assign' | 'priority' | 'delete' | null;
  }>({ open: false, action: null });

  // Bulk actions hook
  const { bulkStatusChange, bulkAssign, bulkPriorityChange, bulkDelete } = useBulkWorkOrderActions();

  // Fetch work orders with enhanced data
  const { data: workOrders, isLoading, refetch } = useQuery({
    queryKey: ["comprehensive-work-orders", searchTerm, selectedAssetType, selectedPriority, selectedStatus, selectedSource, selectedAssignee, startDate, endDate, sortBy, sortOrder, overdueOnly, oosOnly, vehicleId],
    queryFn: async () => {
      let query = supabase
        .from("work_orders")
        .select("*")
        .order("created_at", { ascending: false });
      
      // Filter by vehicleId if provided
      if (vehicleId) {
        query = query.eq("asset_id", vehicleId).eq("asset_type", "vehicle");
      }

      const { data, error } = await query;
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
      
      if (selectedStatus !== 'all') {
        filteredData = filteredData.filter(wo => wo.status === selectedStatus);
      }
      
      if (selectedSource !== 'all') {
        const sourceValue = selectedSource === "pm_schedule" ? "pm" : selectedSource;
        filteredData = filteredData.filter(wo => wo.source === sourceValue);
      }
      
      // Date range filtering
      if (startDate) {
        filteredData = filteredData.filter(wo => {
          const createdDate = new Date(wo.created_at);
          return createdDate >= new Date(startDate);
        });
      }
      
      if (endDate) {
        filteredData = filteredData.filter(wo => {
          const createdDate = new Date(wo.created_at);
          return createdDate <= new Date(endDate + 'T23:59:59');
        });
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

      // Apply sorting
      filteredData.sort((a, b) => {
        let comparison = 0;
        
        if (sortBy === 'priority') {
          const priorityOrder = { critical: 0, high: 1, normal: 2, low: 3 };
          const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
          const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
          comparison = aPriority - bPriority;
        } else if (sortBy === 'due_date') {
          const aDate = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          const bDate = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          comparison = aDate - bDate;
        } else { // created_at
          const aDate = new Date(a.created_at).getTime();
          const bDate = new Date(b.created_at).getTime();
          comparison = aDate - bDate;
        }
        
        return sortOrder === 'asc' ? comparison : -comparison;
      });

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

  // Status change mutation with validation and history tracking
  const statusChangeMutation = useMutation({
    mutationFn: async ({ workOrderId, newStatus }: { workOrderId: string; newStatus: string }) => {
      // Fetch full work order details for validation
      const { data: workOrder, error: fetchError } = await supabase
        .from('work_orders')
        .select('*, work_order_parts(*), work_order_signatures(*)')
        .eq('id', workOrderId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!workOrder) throw new Error("Work order not found");
      
      // Validate business rules
      const validation = canMoveToStatus(workOrder, newStatus);
      if (!validation.allowed) {
        throw new Error(validation.reason || "Cannot change status");
      }
      
      // Update status
      const { error: updateError } = await supabase
        .from('work_orders')
        .update({ 
          status: newStatus as "open" | "awaiting_parts" | "in_progress" | "vendor" | "on_hold" | "ready_for_verification" | "completed",
          updated_at: new Date().toISOString()
        })
        .eq('id', workOrderId);
      
      if (updateError) throw updateError;
      
      // Insert history record
      const historyMessage = getStatusTransitionMessage(workOrder.status, newStatus);
      await supabase.from('work_order_history').insert({
        work_order_id: workOrderId,
        from_status: workOrder.status,
        to_status: newStatus,
        changed_by: user?.id || 'unknown',
        note: historyMessage
      });

      // Trigger notification for status change
      if (user?.id && workOrder) {
        try {
          // Get asset name from the work order data
          const assetName = (workOrder as any).asset_name || 'Unknown Asset';
          
          await triggerWorkOrderStatusChangeNotification({
            workOrderId,
            workOrderNumber: workOrder.work_order_number || 'Unknown',
            assetName,
            oldStatus: workOrder.status,
            newStatus,
            assigneeId: workOrder.assigned_to,
            priority: workOrder.priority,
            changedBy: user.id,
            notes: historyMessage
          });
        } catch (error) {
          console.error('Failed to send work order notification:', error);
        }
      }
      
      return { workOrder, newStatus };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comprehensive-work-orders"] });
      toast({
        title: "Status updated",
        description: `Work order moved to ${data.newStatus.replace('_', ' ')}`
      });
    },
    onError: (error: any) => {
      console.error('Error updating status:', error);
      toast({
        title: "Cannot change status",
        description: error.message || "Failed to update work order status",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (workOrderId: string, newStatus: string) => {
    statusChangeMutation.mutate({ workOrderId, newStatus });
  };

  const handleEdit = (workOrder: any) => {
    setSelectedWorkOrderId(workOrder.id);
    setDetailDrawerOpen(true);
  };

  const handleViewDetails = (workOrder: any) => {
    setSelectedWorkOrderId(workOrder.id);
    setDetailDrawerOpen(true);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedAssetType !== 'all') count++;
    if (selectedPriority !== 'all') count++;
    if (selectedStatus !== 'all') count++;
    if (selectedSource !== 'all') count++;
    if (selectedAssignee !== 'all') count++;
    if (startDate) count++;
    if (endDate) count++;
    if (overdueOnly) count++;
    if (oosOnly) count++;
    return count;
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedAssetType('all');
    setSelectedPriority('all');
    setSelectedStatus('all');
    setSelectedSource('all');
    setSelectedAssignee('all');
    setStartDate('');
    setEndDate('');
    setSortBy('created_at');
    setSortOrder('desc');
    setOverdueOnly(false);
    setOosOnly(false);
  };

  // Bulk action handler
  const handleBulkAction = (action: 'status' | 'assign' | 'priority' | 'delete' | 'export', workOrderIds: string[]) => {
    setSelectedWorkOrderIds(workOrderIds);
    
    if (action === 'export') {
      // Export immediately without dialog
      const workOrdersToExport = (workOrders || []).filter(wo => workOrderIds.includes(wo.id));
      exportWorkOrdersToCSV(workOrdersToExport, `work-orders-${new Date().toISOString().split('T')[0]}.csv`);
      toast({
        title: "Export complete",
        description: `${workOrderIds.length} work orders exported to CSV`
      });
    } else {
      // Show dialog for other actions
      setBulkActionDialog({ open: true, action });
    }
  };

  const handleBulkActionConfirm = async (value?: string) => {
    const { action } = bulkActionDialog;
    
    try {
      switch (action) {
        case 'status':
          if (value) {
            await bulkStatusChange.mutateAsync({ 
              workOrderIds: selectedWorkOrderIds, 
              newStatus: value 
            });
          }
          break;
        
        case 'assign':
          if (value) {
            await bulkAssign.mutateAsync({ 
              workOrderIds: selectedWorkOrderIds, 
              assigneeId: value 
            });
          }
          break;
        
        case 'priority':
          if (value) {
            await bulkPriorityChange.mutateAsync({ 
              workOrderIds: selectedWorkOrderIds, 
              newPriority: value 
            });
          }
          break;
        
        case 'delete':
          await bulkDelete.mutateAsync({ workOrderIds: selectedWorkOrderIds });
          break;
      }
      
      // Clear selection and close dialog
      setSelectedWorkOrderIds([]);
      setBulkActionDialog({ open: false, action: null });
    } catch (error) {
      console.error('Bulk action error:', error);
    }
  };

  const handleClearSelection = () => {
    setSelectedWorkOrderIds([]);
  };

  const isProcessingBulkAction = 
    bulkStatusChange.isPending || 
    bulkAssign.isPending || 
    bulkPriorityChange.isPending || 
    bulkDelete.isPending;

  const handleExport = async () => {
    if (!workOrders || workOrders.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no work orders to export",
        variant: "destructive"
      });
      return;
    }

    try {
      await exportWorkOrdersToCSV(workOrders);
      toast({
        title: "Export successful",
        description: `Exported ${workOrders.length} work orders to CSV`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "Failed to export work orders",
        variant: "destructive"
      });
    }
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
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <FileDown className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExport}>
                <FileText className="h-4 w-4 mr-2" />
                Export to CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setIsAddDrawerOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Work Order
          </Button>
        </div>
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
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedSource={selectedSource}
        onSourceChange={setSelectedSource}
        selectedAssignee={selectedAssignee}
        onAssigneeChange={setSelectedAssignee}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        activeFiltersCount={getActiveFiltersCount()}
        onClearFilters={handleClearFilters}
        hideAssetTypeFilter={!!vehicleId}
      />

      {/* View Toggle */}
      <div className="flex items-center justify-between">
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
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        {view !== 'analytics' && (
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="overdue-filter"
                checked={overdueOnly}
                onCheckedChange={setOverdueOnly}
              />
              <Label htmlFor="overdue-filter" className="text-sm">Overdue only</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="oos-filter"
                checked={oosOnly}
                onCheckedChange={setOosOnly}
              />
              <Label htmlFor="oos-filter" className="text-sm">Out of service</Label>
            </div>
          </div>
        )}
      </div>

      {view === 'board' && (
        <WorkOrderKanbanBoard
          workOrders={workOrders as any || []}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          onStatusChange={handleStatusChange}
          onBulkAction={handleBulkAction}
          selectedWorkOrderIds={selectedWorkOrderIds}
          onSelectionChange={setSelectedWorkOrderIds}
        />
      )}

      {view === 'list' && (
        <WorkOrderListView
          workOrders={workOrders as any || []}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          onStatusChange={handleStatusChange}
          onBulkAction={handleBulkAction}
          isStatusChanging={statusChangeMutation.isPending}
        />
      )}

      {view === 'calendar' && (
        <WorkOrderCalendarViewEnhanced
          workOrders={workOrders as WorkOrder[] || []}
          onEdit={handleEdit}
          onViewDetails={handleViewDetails}
          onStatusChange={handleStatusChange}
          onRefresh={() => refetch()}
        />
      )}

      {view === 'analytics' && (
        <WorkOrderAnalyticsDashboard />
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedWorkOrderIds.length}
        onAction={(action) => handleBulkAction(action, selectedWorkOrderIds)}
        onClear={handleClearSelection}
        isProcessing={isProcessingBulkAction}
      />

      {/* Bulk Actions Dialog */}
      <BulkActionsDialog
        open={bulkActionDialog.open}
        onOpenChange={(open) => setBulkActionDialog({ open, action: null })}
        action={bulkActionDialog.action}
        selectedCount={selectedWorkOrderIds.length}
        onConfirm={handleBulkActionConfirm}
        isProcessing={isProcessingBulkAction}
        technicians={[]}
      />

      {/* Add Work Order Drawer */}
      <AddWorkOrderDrawer
        open={isAddDrawerOpen}
        onOpenChange={setIsAddDrawerOpen}
        onSuccess={() => refetch()}
        vehicleContextId={vehicleId || null}
        vehicleContextName={licensePlate || null}
      />

      {/* Work Order Detail Drawer */}
      <WorkOrderDetailDrawer
        workOrderId={selectedWorkOrderId}
        open={detailDrawerOpen}
        onOpenChange={setDetailDrawerOpen}
        onSuccess={() => refetch()}
      />
    </div>
  );
};