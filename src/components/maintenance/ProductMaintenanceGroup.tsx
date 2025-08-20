import React, { useState } from "react";
import { ChevronDown, ChevronRight, Wrench, Clock, AlertTriangle, DollarSign, Calendar, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MaintenanceItemActions } from "@/components/inventory/MaintenanceItemActions";
import { UnifiedMaintenanceItemModal } from "@/components/inventory/UnifiedMaintenanceItemModal";
import { ReturnToServiceModal, type ItemCondition } from "@/components/inventory/ReturnToServiceModal";
import { MaintenanceHistorySection } from "@/components/inventory/MaintenanceHistorySection";

interface ProductMaintenanceGroupProps {
  product: {
    id: string;
    name: string;
    base_image?: string;
    product_items: Array<{
      id: string;
      item_code: string;
      status: string;
      maintenance_start_date?: string;
      maintenance_reason?: string;
      expected_return_date?: string;
      maintenance_notes?: string;
      total_maintenance_cost?: number;
      current_storage_location_id?: string;
      tool_number?: string;
    }>;
  };
  isExpanded: boolean;
  onToggleExpansion: () => void;
}

export const ProductMaintenanceGroup: React.FC<ProductMaintenanceGroupProps> = ({
  product,
  isExpanded,
  onToggleExpansion
}) => {
  const queryClient = useQueryClient();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [itemsToReturn, setItemsToReturn] = useState<Array<{ id: string; itemCode: string }>>([]);

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
        // Upload completion photos
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

        // Create completion update
        const { error: updErr } = await supabase
          .from('maintenance_updates')
          .insert({
            item_id: id,
            title: 'Repair Completed',
            description: completionSummary || 'Unit returned to service',
            update_type: 'completion',
            completion_photos: uploadedUrls.length ? uploadedUrls : null,
            completion_notes: completionSummary || null,
            status_change_from: 'maintenance',
            status_change_to: 'available',
          });
        if (updErr) throw updErr;

        // Return the item to service
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
      queryClient.invalidateQueries({ queryKey: ["products-with-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["maintenance-stats"] });
      setSelectedItems([]);
      setReturnModalOpen(false);
      setItemsToReturn([]);
    },
    onError: (error) => {
      toast.error("Failed to return items to service");
      console.error(error);
    }
  });

  const maintenanceItems = product.product_items || [];
  const totalCost = maintenanceItems.reduce((sum, item) => sum + (item.total_maintenance_cost || 0), 0);
  const overdueItems = maintenanceItems.filter(item => {
    if (!item.expected_return_date) return false;
    return new Date(item.expected_return_date) < new Date();
  }).length;

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === maintenanceItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(maintenanceItems.map(item => item.id));
    }
  };

  const handleReturnToService = () => {
    if (selectedItems.length === 0) {
      toast.error("Please select items to return to service");
      return;
    }
    
    const items = maintenanceItems.filter(item => selectedItems.includes(item.id))
      .map(item => ({ id: item.id, itemCode: item.item_code }));
    
    setItemsToReturn(items);
    setReturnModalOpen(true);
  };

  const handleEditMaintenance = (item: any) => {
    setSelectedItem(item);
    setEditModalOpen(true);
  };

  const handleReturnConfirm = (payload: { 
    itemsWithConditions: Array<{ id: string; itemCode: string; condition: ItemCondition }>; 
    completionSummary: string; 
    completionPhotos: Array<{ file: File; preview: string }> 
  }) => {
    const itemsWithConditions = payload.itemsWithConditions.map(({ id, condition }) => ({ id, condition }));
    returnToServiceMutation.mutate({
      itemsWithConditions,
      completionSummary: payload.completionSummary,
      completionPhotos: payload.completionPhotos,
    });
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

  const isOverdue = (expectedReturnDate: string | null) => {
    if (!expectedReturnDate) return false;
    return new Date(expectedReturnDate) < new Date();
  };

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={onToggleExpansion}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="w-8 h-8 p-0">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </Button>
              
              {product.base_image && (
                <img 
                  src={product.base_image} 
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                />
              )}
              
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{product.name}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <Badge variant="outline" className="text-blue-600 border-blue-200">
                    {maintenanceItems.length} in maintenance
                  </Badge>
                  {overdueItems > 0 && (
                    <Badge variant="destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {overdueItems} overdue
                    </Badge>
                  )}
                  <span className="text-sm text-gray-600">
                    Cost: ${totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {selectedItems.length > 0 && isExpanded && (
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-100 text-blue-700">
                  {selectedItems.length} selected
                </Badge>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReturnToService();
                  }}
                  disabled={returnToServiceMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  <Wrench className="w-4 h-4 mr-2" />
                  Return to Service
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="pt-0">
            <div className="space-y-4">
              {/* Current Maintenance Items */}
              {maintenanceItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">Current Maintenance Items</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                    >
                      {showHistory ? "Hide History" : "Show History"}
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-12">
                            <Checkbox 
                              checked={selectedItems.length === maintenanceItems.length && maintenanceItems.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Unit Code</TableHead>
                          <TableHead>Tool Number</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Expected Return</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-16">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {maintenanceItems.map((item, index) => (
                          <TableRow key={item.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                            <TableCell>
                              <Checkbox
                                checked={selectedItems.includes(item.id)}
                                onCheckedChange={() => toggleItemSelection(item.id)}
                              />
                            </TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {item.item_code}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-gray-600">
                              {item.tool_number || "—"}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {getStorageLocationName(item.current_storage_location_id)}
                              </div>
                            </TableCell>
                            <TableCell className="text-gray-600">
                              {item.maintenance_reason || "No reason specified"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                <span className={isOverdue(item.expected_return_date) ? "text-red-600 font-medium" : "text-gray-600"}>
                                  {formatDate(item.expected_return_date)}
                                </span>
                                {isOverdue(item.expected_return_date) && (
                                  <AlertTriangle className="w-3 h-3 text-red-600" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-3 h-3" />
                                <span className="text-gray-600">
                                  ${(item.total_maintenance_cost || 0).toLocaleString()}
                                </span>
                              </div>
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
                                onAddUpdate={() => {}}
                                onViewHistory={() => {}}
                                onReturnToService={() => {
                                  setItemsToReturn([{ id: item.id, itemCode: item.item_code }]);
                                  setReturnModalOpen(true);
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              {/* Maintenance History Section */}
              {showHistory && (
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-4">Maintenance History</h4>
                  <MaintenanceHistorySection productId={product.id} />
                </div>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Modals */}
      <UnifiedMaintenanceItemModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        productId={product.id}
        storageLocations={storageLocations}
      />

      <ReturnToServiceModal
        open={returnModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setReturnModalOpen(false);
            setItemsToReturn([]);
          }
        }}
        items={itemsToReturn}
        onConfirm={handleReturnConfirm}
        isLoading={returnToServiceMutation.isPending}
      />
    </>
  );
};