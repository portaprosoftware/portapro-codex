
import React, { useState, useEffect } from "react";
import { Plus, QrCode, Search, Filter, Edit, Trash, ChevronDown, ChevronRight, Settings, Camera, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EditItemModal } from "./EditItemModal";
import { CreateItemModal } from "./CreateItemModal";
import { QRCodeDropdown } from "./QRCodeDropdown";
import { QRCodeScanner } from "./QRCodeScanner";
import { StockAdjustmentWizard } from "./StockAdjustmentWizard";
import { AttributeFilters } from "./AttributeFilters";
import { OCRPhotoCapture } from "./OCRPhotoCapture";
import { OCRSearchCapture } from "./OCRSearchCapture";
import { EnhancedSearchFilters } from "./EnhancedSearchFilters";
import { BatchOCRProcessor } from "./BatchOCRProcessor";
import { MobilePWAOptimizedOCR } from "./MobilePWAOptimizedOCR";

interface IndividualUnitsTabProps {
  productId: string;
  toolNumberToFind?: string | null;
}

export const IndividualUnitsTab: React.FC<IndividualUnitsTabProps> = ({ productId, toolNumberToFind }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [showOCRCapture, setShowOCRCapture] = useState(false);
  const [showOCRSearch, setShowOCRSearch] = useState(false);
  const [showBatchOCR, setShowBatchOCR] = useState(false);
  const [showMobileOCR, setShowMobileOCR] = useState(false);
  const [ocrItemId, setOcrItemId] = useState<string | null>(null);
  const [ocrItemCode, setOcrItemCode] = useState<string>("");
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
        .select("name, stock_total")
        .eq("id", productId)
        .single();
      
      if (error) throw error;
      return data;
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

  const getStatusBadge = (status: string) => {
    const colors = {
      available: "bg-blue-100 text-blue-700 border-blue-200",
      assigned: "bg-amber-100 text-amber-700 border-amber-200",
      maintenance: "bg-red-100 text-red-700 border-red-200"
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors.available}>
        {status}
      </Badge>
    );
  };

  const getVariationText = (item: any) => {
    const variations = [];
    if (item.color) variations.push(item.color);
    if (item.size) variations.push(item.size);
    if (item.material) variations.push(item.material);
    
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
      {/* Header Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search by item code, QR code, tool number, vendor ID"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Availability" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="all">All Availability</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="assigned">Assigned</SelectItem>
              <SelectItem value="maintenance">In Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowOCRSearch(true)}
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
            title="Search by photographing tool number"
          >
            <Camera className="w-4 h-4 mr-2" />
            Search Photo
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
            onClick={() => setShowStockAdjustment(true)}
            className="border-gray-600 text-gray-600 hover:bg-gray-50"
          >
            <Settings className="w-4 h-4 mr-2" />
            Adjust Stock
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowBatchOCR(true)}
            className="border-green-600 text-green-600 hover:bg-green-50"
            title="Process multiple items automatically using OCR"
          >
            <Camera className="w-4 h-4 mr-2" />
            Batch OCR
          </Button>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Item
          </Button>
        </div>
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
              <TableHead className="font-medium">Item Code</TableHead>
              <TableHead className="font-medium">Status</TableHead>
              <TableHead className="font-medium">Variations</TableHead>
              <TableHead className="font-medium">Tool Number</TableHead>
              <TableHead className="font-medium">Verification</TableHead>
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
                  <TableCell className="font-medium">{item.item_code}</TableCell>
                  <TableCell>{getStatusBadge(item.status)}</TableCell>
                  <TableCell className="text-gray-600">{getVariationText(item)}</TableCell>
                  <TableCell className="text-gray-600 font-mono text-xs">
                    {item.tool_number || "—"}
                  </TableCell>
                  <TableCell>
                    {getVerificationBadge(item.verification_status, item.ocr_confidence_score)}
                  </TableCell>
                  <TableCell>
                    <QRCodeDropdown 
                      itemCode={item.item_code} 
                      itemId={item.id}
                      qrCodeData={item.qr_code_data}
                      onQRUpdate={(qrData) => handleQRUpdate(item.id, qrData)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => handleOCRCapture(item.id, item.item_code)}
                        title="OCR Tool Tracking"
                      >
                        <Camera className="w-4 h-4 text-gray-400 hover:text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-6 h-6 p-0"
                        onClick={() => setEditingItem(item.id)}
                      >
                        <Edit className="w-4 h-4 text-gray-400 hover:text-blue-600" />
                      </Button>
                      <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                        <Trash className="w-4 h-4 text-gray-400 hover:text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>,
                
                // Expanded Row Details
                expandedRows.includes(item.id) ? (
                  <TableRow key={`${item.id}-expanded`} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <TableCell colSpan={9} className="border-t">
                      <div className="py-4 space-y-4 text-sm">
                        {/* OCR Tracking Information */}
                        {(item.tool_number || item.vendor_id || item.plastic_code) && (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                              <Camera className="w-4 h-4 mr-2" />
                              Tool Tracking Information
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              <div>
                                <span className="font-medium text-blue-700">Tool Number:</span>
                                <p className="text-blue-600 mt-1 font-mono">{item.tool_number || "—"}</p>
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
            No individual units found. Create your first tracked item to get started.
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

      {/* QR Scanner - Direct Component (no outer dialog) */}
      {showScanner && (
        <QRCodeScanner
          onScan={handleScanResult}
          onClose={() => setShowScanner(false)}
        />
      )}

      {/* Stock Adjustment Dialog - Compact Version */}
      <Dialog open={showStockAdjustment} onOpenChange={setShowStockAdjustment}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          {product && (
            <StockAdjustmentWizard
              productId={productId}
              productName={product.name}
              currentStock={product.stock_total}
              onComplete={() => {
                setShowStockAdjustment(false);
                refetch();
              }}
              onCancel={() => setShowStockAdjustment(false)}
            />
          )}
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

      {/* Batch OCR Processor */}
      <BatchOCRProcessor
        open={showBatchOCR}
        onClose={() => setShowBatchOCR(false)}
        productId={productId}
      />
    </div>
  );
};
