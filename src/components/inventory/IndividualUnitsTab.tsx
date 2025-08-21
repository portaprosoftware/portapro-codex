
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, QrCode, Search, Filter, Edit, Trash, ChevronDown, ChevronRight, Settings, Camera, Shield, AlertTriangle, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EditItemModal } from "./EditItemModal";
import { CreateItemModal } from "./CreateItemModal";
import { SimpleQRCode } from "./SimpleQRCode";
import { QRCodeScanner } from "./QRCodeScanner";
import { PrintQRModal } from "./PrintQRModal";

import { AttributeFilters } from "./AttributeFilters";
import { OCRPhotoCapture } from "./OCRPhotoCapture";
import { OCRSearchCapture } from "./OCRSearchCapture";
import { EnhancedSearchFilters } from "./EnhancedSearchFilters";
import { MobilePWAOptimizedOCR } from "./MobilePWAOptimizedOCR";
import { DeleteItemDialog } from "./DeleteItemDialog";
import { ItemActionsMenu } from "./ItemActionsMenu";
import { InventoryLogicPopup } from "./InventoryLogicPopup";
import { UnitNavigationDialog } from "./UnitNavigationDialog";


interface IndividualUnitsTabProps {
  productId: string;
  toolNumberToFind?: string | null;
}

export const IndividualUnitsTab: React.FC<IndividualUnitsTabProps> = ({ productId, toolNumberToFind }) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showPrintQRModal, setShowPrintQRModal] = useState(false);
  
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [showOCRSearch, setShowOCRSearch] = useState(false);
  const [showMobileOCR, setShowMobileOCR] = useState(false);
  const [ocrItemId, setOcrItemId] = useState<string | null>(null);
  const [ocrItemCode, setOcrItemCode] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, code: string} | null>(null);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [selectedUnitForNavigation, setSelectedUnitForNavigation] = useState<{id: string, code: string} | null>(null);
  
  const [attributeFilters, setAttributeFilters] = useState<{
    color?: string;
    size?: string;
    material?: string;
    condition?: string;
  }>({});
  const [enhancedFilters, setEnhancedFilters] = useState<{
    availability?: string;
    toolNumber?: string;
    vendorId?: string;
    verificationStatus?: string;
    manufacturingDateRange?: any;
    confidenceRange?: [number, number];
    attributes?: Record<string, string>;
  }>({});

  // Auto-set tool number filter when navigating from OCR search
  useEffect(() => {
    if (toolNumberToFind) {
      setEnhancedFilters(prev => ({
        ...prev,
        toolNumber: toolNumberToFind
      }));
    }
  }, [toolNumberToFind]);

  const { data: items, isLoading, refetch } = useQuery({
    queryKey: ["product-items", productId, searchQuery, availabilityFilter, attributeFilters, enhancedFilters],
    queryFn: async () => {
      let query = supabase
        .from("product_items")
        .select("*, tool_number, vendor_id, plastic_code, manufacturing_date, mold_cavity, ocr_confidence_score, verification_status, tracking_photo_url")
        .eq("product_id", productId);

      if (searchQuery) {
        query = query.or(`item_code.ilike.%${searchQuery}%,qr_code_data.ilike.%${searchQuery}%,location.ilike.%${searchQuery}%,tool_number.ilike.%${searchQuery}%,vendor_id.ilike.%${searchQuery}%`);
      }

      // Apply enhanced filters
      if (enhancedFilters.toolNumber) {
        query = query.ilike("tool_number", `%${enhancedFilters.toolNumber}%`);
      }
      if (enhancedFilters.vendorId) {
        query = query.ilike("vendor_id", `%${enhancedFilters.vendorId}%`);
      }
      if (enhancedFilters.verificationStatus && enhancedFilters.verificationStatus !== "all") {
        query = query.eq("verification_status", enhancedFilters.verificationStatus);
      }
      if (enhancedFilters.confidenceRange) {
        query = query
          .gte("ocr_confidence_score", enhancedFilters.confidenceRange[0] / 100)
          .lte("ocr_confidence_score", enhancedFilters.confidenceRange[1] / 100);
      }

      if (availabilityFilter !== "all") {
        query = query.eq("status", availabilityFilter);
      }

      // Apply attribute filters
      if (attributeFilters.color) {
        query = query.eq("color", attributeFilters.color);
      }
      if (attributeFilters.size) {
        query = query.eq("size", attributeFilters.size);
      }
      if (attributeFilters.material) {
        query = query.eq("material", attributeFilters.material);
      }
      if (attributeFilters.condition) {
        query = query.eq("condition", attributeFilters.condition);
      }

      const { data, error } = await query.order("item_code");
      if (error) throw error;
      return data || [];
    }
  });

  const { data: product } = useQuery({
    queryKey: ["product", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("name, stock_total, default_item_code_category")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Bulk-fetch item variation attributes for display
  const { data: itemAttributesMap = {} } = useQuery({
    queryKey: ["item-attributes-bulk", productId, items?.map((i: any) => i.id).join(",")],
    enabled: !!items && items.length > 0,
    queryFn: async () => {
      const ids = (items as any[]).map(i => i.id);
      const { data: attributes, error: attrError } = await supabase
        .from("product_item_attributes")
        .select("item_id, property_id, property_value")
        .in("item_id", ids);
      if (attrError) throw attrError;
      if (!attributes || attributes.length === 0) return {};

      const propIds = Array.from(new Set(attributes.map(a => a.property_id)));
      const { data: properties, error: propError } = await supabase
        .from("product_properties")
        .select("id, attribute_name")
        .in("id", propIds);
      if (propError) throw propError;

      const map: Record<string, Record<string, string>> = {};
      attributes.forEach((attr) => {
        const prop = properties?.find((p) => p.id === attr.property_id);
        if (prop?.attribute_name) {
          const key = prop.attribute_name.toLowerCase();
          if (!map[attr.item_id]) map[attr.item_id] = {};
          map[attr.item_id][key] = attr.property_value;
        }
      });

      return map;
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('product_items')
        .delete()
        .eq('id', itemId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Item deleted successfully');
      queryClient.invalidateQueries({ queryKey: ["product-items", productId] });
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error) => {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  });

  // Fetch storage locations for name lookup
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

  // Helper function to get storage location name
  const getStorageLocationName = (locationId: string | null) => {
    if (!locationId || !storageLocations) return "Not set";
    const location = storageLocations.find(loc => loc.id === locationId);
    return location?.name || locationId.substring(0, 8) + "...";
  };

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

  const handleAttributeFilterChange = (key: string, value: string | undefined) => {
    setAttributeFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleClearFilters = () => {
    setAttributeFilters({});
  };

  const handleScanResult = (result: string) => {
    console.log("Scanned QR code:", result);
    setShowScanner(false);
    
    // Parse the QR code and find the item
    try {
      const data = JSON.parse(result);
      if (data.type === "inventory_item" && data.itemCode) {
        setSearchQuery(data.itemCode);
      }
    } catch (error) {
      // If not JSON, treat as direct item code search
      setSearchQuery(result);
    }
  };

  const handleQRUpdate = (itemId: string, qrData: string) => {
    refetch();
  };

  const handleOCRCapture = (itemId: string, itemCode: string) => {
    setOcrItemId(itemId);
    setOcrItemCode(itemCode);
    setShowOCRCapture(true);
  };

  const handleOCRComplete = (ocrData: any) => {
    console.log('OCR completed for item:', ocrItemId, ocrData);
    setShowOCRCapture(false);
    setOcrItemId(null);
    setOcrItemCode("");
    refetch();
  };

  const handleOCRSearchResult = (searchTerm: string, confidence?: number) => {
    setSearchQuery(searchTerm);
    setShowOCRSearch(false);
  };

  const handleDeleteItem = (itemId: string, itemCode: string) => {
    setItemToDelete({ id: itemId, code: itemCode });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteItemMutation.mutate(itemToDelete.id);
    }
  };

  const handleUnitCodeClick = (itemId: string, itemCode: string) => {
    setSelectedUnitForNavigation({ id: itemId, code: itemCode });
    setShowNavigationDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const gradients = {
      available: "bg-gradient-to-r from-green-600 to-green-700 text-white font-bold",
      assigned: "bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold",
      maintenance: "bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold",
      out_of_service: "bg-gradient-to-r from-gray-600 to-gray-700 text-white font-bold"
    };

    const statusLabels = {
      available: "Available",
      assigned: "On Job", 
      maintenance: "Maintenance",
      out_of_service: "Permanently Retired"
    };

    return (
      <Badge className={gradients[status as keyof typeof gradients] || gradients.available}>
        {statusLabels[status as keyof typeof statusLabels] || status}
      </Badge>
    );
  };

  const getVariationText = (item: any) => {
    const variations: string[] = [];
    const attrs = (itemAttributesMap as Record<string, Record<string, string> | undefined>)[item.id];
    const color = attrs?.color || item.color;
    const size = attrs?.size || item.size;
    const material = attrs?.material || item.material;

    if (color) variations.push(color);
    if (size) variations.push(size);
    if (material) variations.push(material);
    
    return variations.length > 0 ? variations.join(", ") : "Not set";
  };

  const getVerificationBadge = (status: string | null, confidence: number | null) => {
    if (!status) return null;
    
    const badges = {
      manual_verified: <Badge className="bg-green-100 text-green-700"><Shield className="w-3 h-3 mr-1" />Verified</Badge>,
      auto_detected: confidence && confidence > 0.8 
        ? <Badge className="bg-blue-100 text-blue-700">Auto-detected</Badge>
        : <Badge className="bg-yellow-100 text-yellow-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>,
      needs_review: <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Needs Review</Badge>
    };

    return badges[status as keyof typeof badges] || null;
  };

  if (isLoading) {
    return <div className="p-6">Loading units...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Category Info Banner */}
      {product?.default_item_code_category && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {product.name} items use: <span className="font-bold">{product.default_item_code_category}s</span> category
              </p>
              <p className="text-sm text-gray-600 mt-1">
                New individual items will automatically use this category for item codes.
              </p>
            </div>
            <Badge className="bg-blue-600 text-white font-medium">
              {product.default_item_code_category}s
            </Badge>
          </div>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex items-center gap-4">
        <InventoryLogicPopup />
        <Button
          variant="outline" 
          onClick={() => setShowOCRSearch(true)}
          className="border-purple-600 text-purple-600 hover:bg-purple-50"
          title="Search by photographing tool number"
        >
          <Camera className="w-4 h-4 mr-2" />
          Capture Panel
        </Button>
        <Button 
          variant="outline" 
          onClick={() => setShowScanner(true)}
          className="border-blue-600 text-blue-600 hover:bg-blue-50"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Scan QR
        </Button>
        <Button 
          variant="outline"
          onClick={() => setShowPrintQRModal(true)}
          className="border-green-600 text-green-600 hover:bg-green-50"
        >
          <QrCode className="w-4 h-4 mr-2" />
          Print QR Codes
        </Button>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Item
        </Button>
      </div>

      {/* Enhanced Search Filters */}
      <EnhancedSearchFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={enhancedFilters}
        onFiltersChange={setEnhancedFilters}
        onClearFilters={() => setEnhancedFilters({})}
      />

      {/* Units Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12">
                <Checkbox />
              </TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="font-medium">Unit Code</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Variations</TableHead>
              <TableHead className="font-medium">Tool Number</TableHead>
              <TableHead className="w-12">QR</TableHead>
              <TableHead className="w-32">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items?.map((item, index) => [
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
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-gray-600">{getVariationText(item)}</TableCell>
                  <TableCell className="text-gray-600 font-mono text-xs">
                    {item.tool_number || "—"}
                  </TableCell>
                  <TableCell>
                    <SimpleQRCode 
                      itemCode={item.item_code} 
                      qrCodeData={item.qr_code_data}
                      showAsButton={true}
                    />
                  </TableCell>
                  <TableCell>
                    <ItemActionsMenu
                      itemId={item.id}
                      itemCode={item.item_code}
                      onEdit={() => setEditingItem(item.id)}
                      onDelete={() => handleDeleteItem(item.id, item.item_code)}
                      qrCodeData={item.qr_code_data}
                    />
                  </TableCell>
                </TableRow>,
                
                // Expanded Row Details
                expandedRows.includes(item.id) ? (
                <TableRow key={`${item.id}-expanded`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell colSpan={8} className="border-t">
                      <div className="py-4 space-y-4 text-sm">
                        {/* OCR Tracking Information */}
                        {(item.tool_number || item.vendor_id || item.plastic_code) && (
                          <div className="p-3 bg-white border border-gray-200 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                              <Camera className="w-4 h-4 mr-2" />
                              Tool Tracking Information
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <span className="font-medium text-gray-700">Tool Number:</span>
                                <p className="text-gray-600 mt-1 font-mono">{item.tool_number || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Vendor ID:</span>
                                <p className="text-blue-600 mt-1 font-mono">{item.vendor_id || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Plastic Code:</span>
                                <p className="text-blue-600 mt-1">{item.plastic_code || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Mfg Date:</span>
                                <p className="text-blue-600 mt-1">{item.manufacturing_date || "—"}</p>
                              </div>
                              <div>
                                <span className="font-medium text-blue-700">Mold Cavity:</span>
                                <p className="text-blue-600 mt-1">{item.mold_cavity || "—"}</p>
                              </div>
                              {item.ocr_confidence_score && (
                                <div>
                                  <span className="font-medium text-blue-700">OCR Confidence:</span>
                                  <p className="text-blue-600 mt-1">{Math.round(item.ocr_confidence_score * 100)}%</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        
                        {/* Standard Item Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <p className="text-gray-600 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Updated:</span>
                            <p className="text-gray-600 mt-1">{new Date(item.updated_at).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Last Location:</span>
                            <p className="text-gray-600 mt-1">{item.last_known_location ? String(item.last_known_location) : "Not set"}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Storage Location:</span>
                            <p className="text-gray-600 mt-1">{getStorageLocationName(item.current_storage_location_id)}</p>
                          </div>
                        </div>
                        
                        {item.notes && (
                          <div>
                            <span className="font-medium text-gray-700">Notes:</span>
                            <p className="text-gray-600 mt-1">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null
            ].filter(Boolean))}
          </TableBody>
        </Table>

        {(!items || items.length === 0) && (
          <div className="p-8 text-center text-gray-500">
            No tracked units found. Create your first tracked item to get started.
          </div>
        )}
      </div>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditItemModal
          itemId={editingItem}
          onClose={() => setEditingItem(null)}
        />
      )}

      {/* Create Item Modal */}
      {showCreateModal && (
        <CreateItemModal
          productId={productId}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* QR Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="sm:max-w-md">
          <QRCodeScanner
            onScan={handleScanResult}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>


      {/* OCR Photo Capture Dialog */}
      {showOCRCapture && ocrItemId && (
        <OCRPhotoCapture
          open={showOCRCapture}
          onClose={() => setShowOCRCapture(false)}
          itemId={ocrItemId}
          itemCode={ocrItemCode}
          onComplete={handleOCRComplete}
        />
      )}

      {/* OCR Search Dialog */}
      <OCRSearchCapture
        open={showOCRSearch}
        onClose={() => setShowOCRSearch(false)}
        onSearchResult={handleOCRSearchResult}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteItemDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemCode={itemToDelete?.code || ""}
        isDeleting={deleteItemMutation.isPending}
      />

      {/* Print QR Modal */}
      <PrintQRModal
        isOpen={showPrintQRModal}
        onClose={() => setShowPrintQRModal(false)}
        productId={productId}
      />

      {/* Unit Navigation Dialog */}
      <UnitNavigationDialog
        isOpen={showNavigationDialog}
        onClose={() => setShowNavigationDialog(false)}
        itemId={selectedUnitForNavigation?.id || ""}
        itemCode={selectedUnitForNavigation?.code || ""}
        showManageOption={false}
        onEditDetails={() => {
          if (selectedUnitForNavigation?.id) {
            setEditingItem(selectedUnitForNavigation.id);
          }
        }}
      />
    </div>
  );
};
