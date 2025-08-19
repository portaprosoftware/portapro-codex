import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Search, Settings, ChevronDown, ChevronRight, AlertTriangle, Clock, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaintenanceItemActions } from "./MaintenanceItemActions";
import { UnifiedMaintenanceItemModal } from "./UnifiedMaintenanceItemModal";
import { ReturnToServiceModal, type ItemCondition } from "./ReturnToServiceModal";
import { UnitNavigationDialog } from "./UnitNavigationDialog";

interface MaintenanceTrackerTabProps {
  productId: string;
}

export const MaintenanceTrackerTab: React.FC<MaintenanceTrackerTabProps> = ({ productId }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [itemsToReturn, setItemsToReturn] = useState<Array<{ id: string; itemCode: string }>>([]);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [selectedUnitForNavigation, setSelectedUnitForNavigation] = useState<{id: string, code: string} | null>(null);

  // Fetch items in maintenance for this product or all products
  const { data: maintenanceItems, isLoading } = useQuery({
    queryKey: ["maintenance-items", productId, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("product_items")
        .select("*, tool_number, vendor_id, maintenance_start_date, maintenance_reason, expected_return_date, maintenance_notes, products(name)")
        .eq("status", "maintenance");

      // If productId is "all", don't filter by product_id
      if (productId !== "all") {
        query = query.eq("product_id", productId);
      }

      if (searchQuery) {
        query = query.or(`item_code.ilike.%${searchQuery}%,tool_number.ilike.%${searchQuery}%,maintenance_notes.ilike.%${searchQuery}%,maintenance_reason.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query.order("item_code");
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch available items for moving to maintenance (only when viewing specific product)
  const { data: availableItems } = useQuery({
    queryKey: ["available-items", productId],
    queryFn: async () => {
      if (productId === "all") return [];
      
      const { data, error } = await supabase
        .from("product_items")
        .select("id, item_code")
        .eq("product_id", productId)
        .eq("status", "available")
        .limit(100);
      
      if (error) throw error;
      return data || [];
    },
    enabled: productId !== "all"
  });

  // Fetch storage locations for display
  const { data: storageLocations } = useQuery({
    queryKey: ["storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name");
      
      if (error) throw error;
      return data || [];
    }
  });

  // Return item to service mutation
  const returnToServiceMutation = useMutation({
    mutationFn: async (payload: {
      itemsWithConditions: Array<{ id: string; condition: ItemCondition }>;
      completionSummary: string;
      completionPhotos: Array<{ file: File; preview: string }>;
    }) => {
      const { itemsWithConditions, completionSummary, completionPhotos } = payload;

      for (const { id, condition } of itemsWithConditions) {
        // 1) Upload completion photos once per item
        const uploadedUrls: string[] = [];
        for (let index = 0; index < completionPhotos.length; index++) {
          const photo = completionPhotos[index];
          const fileExt = photo.file.name.split('.').pop();
          const fileName = `completion-${id}-${Date.now()}-${index}.${fileExt}`;
          const filePath = `unit-photos/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('unit-photos')
            .upload(filePath, photo.file);
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('unit-photos')
            .getPublicUrl(filePath);
          uploadedUrls.push(publicUrl);
        }

        // 2) Find active maintenance session for this item (if any)
        const { data: sessions, error: sessionErr } = await (supabase as any)
          .from('maintenance_sessions')
          .select('*')
          .eq('item_id', id)
          .eq('status', 'active')
          .order('started_at', { ascending: false })
          .limit(1);
        if (sessionErr) throw sessionErr;
        const activeSession = (sessions && sessions[0]) || null;

        // 3) Create a completion update to preserve history
        const { error: updErr } = await (supabase as any)
          .from('maintenance_updates')
          .insert({
            item_id: id,
            title: 'Repair Completed',
            description: completionSummary || 'Unit returned to service',
            update_type: 'completion',
            completion_photos: uploadedUrls.length ? uploadedUrls : null,
            completion_notes: completionSummary || null,
            session_status: 'completed',
            maintenance_session_id: activeSession?.id || null,
            status_change_from: 'maintenance',
            status_change_to: 'available',
          });
        if (updErr) throw updErr;

        // 4) Mark maintenance session as completed (if exists)
        if (activeSession?.id) {
          const { error: sessUpdErr } = await (supabase as any)
            .from('maintenance_sessions')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              final_condition: condition,
              completion_photos: uploadedUrls.length ? uploadedUrls : null,
              session_summary: completionSummary || null,
            })
            .eq('id', activeSession.id);
          if (sessUpdErr) throw sessUpdErr;
        }

        // 5) Return the item to service
        const { error } = await supabase
          .from('product_items')
          .update({
            status: 'available',
            condition,
            maintenance_start_date: null,
            maintenance_reason: null,
            expected_return_date: null,
            maintenance_notes: null,
          })
          .eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: (_, payload) => {
      const itemIds = payload.itemsWithConditions.map((it) => it.id);
      toast.success(`Returned ${itemIds.length} item(s) to service`);
      queryClient.invalidateQueries({ queryKey: ["maintenance-items", productId] });
      queryClient.invalidateQueries({ queryKey: ["available-items", productId] });
      queryClient.invalidateQueries({ queryKey: ["product-items", productId] });
      // Invalidate individual item cache keys to unlock fields in EditItemModal
      itemIds.forEach(itemId => {
        queryClient.invalidateQueries({ queryKey: ["product-item", itemId] });
      });
      setSelectedItems([]);
      setReturnModalOpen(false);
      setItemsToReturn([]);
    },
    onError: (error) => {
      toast.error("Failed to return items to service");
      console.error(error);
    }
  });

  const toggleRowExpansion = (itemId: string) => {
    setExpandedRows(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === maintenanceItems?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(maintenanceItems?.map(item => item.id) || []);
    }
  };

  const handleReturnToService = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to return to service");
      return;
    }
    
    const items = maintenanceItems?.filter(item => selectedItems.includes(item.id))
      .map(item => ({ id: item.id, itemCode: item.item_code })) || [];
    
    setItemsToReturn(items);
    setReturnModalOpen(true);
  };

  // Individual item actions
  const handleEditMaintenance = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleReturnSingleItem = (itemId: string, itemCode: string) => {
    const items = [{ id: itemId, itemCode }];
    setItemsToReturn(items);
    setReturnModalOpen(true);
  };

  const handleUnitCodeClick = (itemId: string, itemCode: string) => {
    setSelectedUnitForNavigation({ id: itemId, code: itemCode });
    setShowNavigationDialog(true);
  };

  const getStorageLocationName = (locationId: string | null) => {
    if (!locationId || !storageLocations) return "Not set";
    const location = storageLocations.find(loc => loc.id === locationId);
    return location?.name || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const handleReturnConfirm = (payload: { itemsWithConditions: Array<{ id: string; itemCode: string; condition: ItemCondition }>; completionSummary: string; completionPhotos: Array<{ file: File; preview: string }> }) => {
    // Strip itemCode (not needed for mutation) and pass through
    const itemsWithConditions = payload.itemsWithConditions.map(({ id, condition }) => ({ id, condition }));
    returnToServiceMutation.mutate({
      itemsWithConditions,
      completionSummary: payload.completionSummary,
      completionPhotos: payload.completionPhotos,
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading maintenance items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Adding a Unit to Maintenance</h4>
            <p className="text-sm text-gray-700 mb-3">
              To add a unit to the maintenance tracker and temporarily remove it from inventory:
            </p>
            <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
              <li>Ensure the unit is tracked (not bulk)</li>
              <li>Edit the unit, select "Maintenance", and save</li>
              <li>The unit will now appear on the Maintenance list and be excluded from active inventory counts</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Header Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Maintenance</h3>
              <p className="text-sm text-gray-600">
                {maintenanceItems?.length || 0} unit(s) currently in maintenance
              </p>
            </div>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-700">
                {selectedItems.length} selected
              </Badge>
              <Button 
                onClick={handleReturnToService}
                disabled={returnToServiceMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Settings className="w-4 h-4 mr-2" />
                Return to Service
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by unit code, tool number, maintenance reason, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Maintenance Items Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {maintenanceItems && maintenanceItems.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedItems.length === maintenanceItems.length && maintenanceItems.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12"></TableHead>
                <TableHead className="font-medium">Unit Code</TableHead>
                {productId === "all" && <TableHead className="font-medium">Product</TableHead>}
                <TableHead className="font-medium">Tool Number</TableHead>
                <TableHead className="font-medium">Location</TableHead>
                <TableHead className="font-medium">Maintenance Reason</TableHead>
                <TableHead className="font-medium">Expected Return</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="w-16">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceItems.map((item, index) => [
                <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => toggleItemSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-6 h-6 p-0"
                      onClick={() => toggleRowExpansion(item.id)}
                    >
                      {expandedRows.includes(item.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </TableCell>
                   <TableCell>
                     <Button 
                       variant="link" 
                       className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                       onClick={() => handleUnitCodeClick(item.id, item.item_code)}
                     >
                       {item.item_code}
                     </Button>
                   </TableCell>
                   {productId === "all" && (
                     <TableCell className="text-gray-600">
                       {item.products?.name || "Unknown Product"}
                     </TableCell>
                   )}
                  <TableCell className="font-mono text-xs text-gray-600">
                    {item.tool_number || "—"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {getStorageLocationName(item.current_storage_location_id)}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {item.maintenance_reason || "No reason specified"}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {formatDate(item.expected_return_date)}
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold">
                      <Wrench className="w-3 h-3 mr-1" />
                      Maintenance
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <MaintenanceItemActions
                      itemId={item.id}
                      itemCode={item.item_code}
                      onEditMaintenance={() => handleEditMaintenance(item)}
                      onAddUpdate={() => { /* unified modal handles updates */ }}
                      onViewHistory={() => { /* unified modal shows history */ }}
                      onReturnToService={() => handleReturnSingleItem(item.id, item.item_code)}
                    />
                  </TableCell>
                </TableRow>,
                
                // Expanded Row Details
                expandedRows.includes(item.id) ? (
                  <TableRow key={`${item.id}-expanded`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell colSpan={productId === "all" ? 10 : 9} className="border-t">
                      <div className="py-4 space-y-4 text-sm">
                        <div className="py-2">
                          {/* Simple text list format */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Reason:</span>
                              <span className="text-gray-600 ml-2">{item.maintenance_reason || "No reason specified"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Notes:</span>
                              <span className="text-gray-600 ml-2">{item.maintenance_notes || "No notes provided"}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Started:</span>
                              <span className="text-gray-600 ml-2 flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(item.maintenance_start_date)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Expected Return:</span>
                              <span className="text-gray-600 ml-2 flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(item.expected_return_date)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Storage Location:</span>
                              <span className="text-gray-600 ml-2">{getStorageLocationName(item.current_storage_location_id)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">Last Location:</span>
                              <span className="text-gray-600 ml-2">{item.location || "Not specified"}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null
              ])}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4">
              <Wrench className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Items in Maintenance</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? "No items match your search criteria."
                : "All units are currently available or in service."
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Clear Search
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedItem && (
        <UnifiedMaintenanceItemModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedItem(null);
          }}
          item={selectedItem}
          productId={productId}
          storageLocations={storageLocations}
        />
      )}

      <ReturnToServiceModal
        open={returnModalOpen}
        onOpenChange={setReturnModalOpen}
        items={itemsToReturn}
        onConfirm={handleReturnConfirm}
        isLoading={returnToServiceMutation.isPending}
      />

      {/* Unit Navigation Dialog */}
      <UnitNavigationDialog
        isOpen={showNavigationDialog}
        onClose={() => setShowNavigationDialog(false)}
        itemId={selectedUnitForNavigation?.id || ""}
        itemCode={selectedUnitForNavigation?.code || ""}
        showManageOption={true}
        onManageUnit={() => {
          if (selectedUnitForNavigation?.id) {
            setSelectedItem(maintenanceItems?.find(item => item.id === selectedUnitForNavigation.id));
            setEditModalOpen(true);
          }
        }}
      />
    </div>
  );
};