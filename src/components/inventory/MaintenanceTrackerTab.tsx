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
    mutationFn: async (itemsWithConditions: Array<{ id: string; condition: ItemCondition }>) => {
      const updates = itemsWithConditions.map(({ id, condition }) => ({
        id,
        status: "available",
        condition,
        maintenance_start_date: null,
        maintenance_reason: null,
        expected_return_date: null,
        maintenance_notes: null
      }));

      for (const update of updates) {
        const { error } = await supabase
          .from("product_items")
          .update({
            status: update.status,
            condition: update.condition,
            maintenance_start_date: update.maintenance_start_date,
            maintenance_reason: update.maintenance_reason,
            expected_return_date: update.expected_return_date,
            maintenance_notes: update.maintenance_notes
          })
          .eq("id", update.id);
        
        if (error) throw error;
      }
    },
    onSuccess: (_, itemsWithConditions) => {
      const itemIds = itemsWithConditions.map(item => item.id);
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

  const getStorageLocationName = (locationId: string | null) => {
    if (!locationId || !storageLocations) return "Not set";
    const location = storageLocations.find(loc => loc.id === locationId);
    return location?.name || "Unknown";
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString();
  };

  const handleReturnConfirm = (itemsWithConditions: Array<{ id: string; itemCode: string; condition: ItemCondition }>) => {
    returnToServiceMutation.mutate(itemsWithConditions);
  };

  if (isLoading) {
    return <div className="p-6">Loading maintenance items...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Adding a Unit to Maintenance</h4>
            <p className="text-sm text-blue-800 mb-3">
              To add a unit to the maintenance tracker and temporarily remove it from inventory:
            </p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
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
                       onClick={() => navigate(`/inventory/manage-unit/${item.id}`)}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Maintenance Details */}
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Maintenance Details
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-gray-700">Reason:</span>
                                <p className="text-gray-600 mt-1">{item.maintenance_reason || "No reason specified"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Notes:</span>
                                <p className="text-gray-600 mt-1">{item.maintenance_notes || "No notes provided"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Started:</span>
                                <p className="text-gray-600 mt-1 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {formatDate(item.maintenance_start_date)}
                                </p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Expected Return:</span>
                                <p className="text-gray-600 mt-1 flex items-center">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  {formatDate(item.expected_return_date)}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Location Information */}
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <MapPin className="w-4 h-4 mr-2" />
                              Location Info
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-gray-700">Storage Location:</span>
                                <p className="text-gray-600 mt-1">{getStorageLocationName(item.current_storage_location_id)}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Last Location:</span>
                                <p className="text-gray-600 mt-1">{item.location || "Not specified"}</p>
                              </div>
                            </div>
                          </div>

                          {/* Item Details */}
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Settings className="w-4 h-4 mr-2" />
                              Item Details
                            </h4>
                            <div className="space-y-2">
                              <div>
                                <span className="font-medium text-gray-700">Condition:</span>
                                <p className="text-gray-600 mt-1">{item.condition || "Not specified"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-gray-700">Vendor ID:</span>
                                <p className="text-gray-600 mt-1 font-mono text-xs">{item.vendor_id || "—"}</p>
                              </div>
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
    </div>
  );
};