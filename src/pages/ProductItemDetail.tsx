import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Settings, Camera, QrCode, History, Edit, MoveRight, Wrench, ChevronRight, Home, Package, Images, X, Target, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UnitActivityTimeline } from "@/components/inventory/UnitActivityTimeline";
import { UnifiedMaintenanceItemModal } from "@/components/inventory/UnifiedMaintenanceItemModal";
import { EditItemModal } from "@/components/inventory/EditItemModal";
import { SimpleQRCode } from "@/components/inventory/SimpleQRCode";
import { UnitPhotoCapture } from "@/components/inventory/UnitPhotoCapture";
import { UnitPhotoGallery } from "@/components/inventory/UnitPhotoGallery";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ProductItemDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Modal states
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceModalTab, setMaintenanceModalTab] = useState<"details" | "update">("details");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showPhotoGallery, setShowPhotoGallery] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["product-item", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required");
      
      // Single optimized query with all needed data
      const { data, error } = await supabase
        .from("product_items")
        .select(`
          id,
          tool_number,
          item_code,
          status,
          condition,
          notes,
          vendor_id,
          plastic_code,
          manufacturing_date,
          mold_cavity,
          ocr_confidence_score,
          ocr_raw_data,
          verification_status,
          tracking_photo_url,
          current_storage_location_id,
          product_id,
          created_at,
          products!inner(
            name,
            image_url,
            default_price_per_day,
            description
          )
        `)
        .eq("id", itemId)
        .maybeSingle();
        
      if (error) throw error;
      if (!data) return null;
      
      // Get storage location name if needed (simplified)
      let storageLocationName = "Unknown location";
      if (data.current_storage_location_id) {
        const { data: location } = await supabase
          .from("storage_locations")
          .select("name")
          .eq("id", data.current_storage_location_id)
          .maybeSingle();
        if (location) storageLocationName = location.name;
      }
      
      return { ...data, storage_location_name: storageLocationName };
    },
    enabled: !!itemId,
    staleTime: 30 * 1000, // Cache for 30 seconds only
  });

  // Fetch storage locations for the maintenance modal
  const { data: storageLocations } = useQuery({
    queryKey: ["storage-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storage_locations")
        .select("id, name")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  // Always show the Tool Tracking Information card (like in edit module)
  const hasTrackingData = true; // Always show the card

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "completed";
      case "rented":
        return "assigned";
      case "maintenance":
        return "warning";
      case "damaged":
        return "warning";
      default:
        return "pending";
    }
  };

  const getConditionVariant = (condition: string): "assigned" => {
    // All condition badges use consistent gradient blue with bold white text
    return "assigned"; // This uses bg-gradient-blue text-white
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="animate-pulse space-y-6">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg border shadow-sm p-6">
                <div className="aspect-square bg-gray-200 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-4">The requested individual unit could not be found.</p>
          <Button onClick={() => navigate("/inventory")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Inventory
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-6 space-y-6 font-inter">
      {/* Header */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate(`/inventory?selectedProduct=${item.product_id}&tab=units&toolNumberToFind=${item.tool_number || item.item_code}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Units
            </Button>
            <div>
              {/* Breadcrumb */}
              <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-600 hover:text-blue-800"
                  onClick={() => navigate("/inventory")}
                >
                  <Home className="w-3 h-3 mr-1" />
                  Inventory
                </Button>
                <ChevronRight className="w-3 h-3" />
                 <Button 
                   variant="link" 
                   className="p-0 h-auto text-blue-600 hover:text-blue-800"
                   onClick={() => navigate(`/inventory?selectedProduct=${item.product_id}`)}
                 >
                   {item.products?.name || 'Unknown Product'}
                 </Button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">Individual Unit</span>
              </div>
              
               <h1 className="text-2xl font-semibold text-gray-900 font-inter">
                 {item.products?.name || 'Unknown Product'}
               </h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-base text-gray-600 font-inter">
                  Individual Unit: {item.tool_number || item.item_code}
                </p>
                <span className="text-sm text-gray-500">•</span>
                <p className="text-sm text-gray-500">
                  Created: {item.created_at ? `${new Date(item.created_at).toLocaleDateString()} at ${new Date(item.created_at).toLocaleTimeString()}` : 'Date unavailable'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={getStatusVariant(item.status)}>
              {capitalizeFirstLetter(item.status || "Unknown")}
            </Badge>
            {item.condition && (
              <Badge variant={getConditionVariant(item.condition)}>
                {capitalizeFirstLetter(item.condition)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Activity Timeline */}
          <UnitActivityTimeline 
            itemId={itemId!} 
            itemCode={item.tool_number || item.item_code} 
          />
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-gray-500">Product Name</label>
                   <p className="text-base font-medium text-gray-900">{item.products?.name || 'Unknown Product'}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Description</label>
                   <p className="text-base text-gray-900">{item.products?.description || "No description"}</p>
                 </div>
                 <div>
                   <label className="text-sm font-medium text-gray-500">Rental Price</label>
                   <p className="text-base font-medium text-gray-900">${item.products?.default_price_per_day || 0}/day</p>
                 </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Status</label>
                  <Badge variant={getStatusVariant(item.status)}>
                    {capitalizeFirstLetter(item.status || "Unknown")}
                  </Badge>
                </div>
              </div>

              {item.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-base text-gray-900 mt-1">{item.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Unit Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Unit Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Tool Number</label>
                  <p className="text-base font-mono text-gray-900">{item.tool_number || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Code</label>
                  <p className="text-base font-mono text-gray-900">{item.item_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Location</label>
                  <p className="text-base text-gray-900">{item.storage_location_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 mb-2 block">Condition</label>
                  <Badge variant={getConditionVariant(item.condition)}>
                    {capitalizeFirstLetter(item.condition || "Unknown")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tool Tracking Information Card - Read Only */}
          {hasTrackingData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Tool Tracking Information
                  {item.tool_number && (
                    <Badge variant="outline" className="ml-2">
                      {item.tool_number}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tool Number</label>
                    <p className="text-base font-mono text-gray-900 mt-1">
                      {item.tool_number || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                    <p className="text-base font-mono text-gray-900 mt-1">
                      {item.vendor_id || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plastic Code</label>
                    <p className="text-base text-gray-900 mt-1">
                      {item.plastic_code || "Not detected"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mfg Date</label>
                    <p className="text-base text-gray-900 mt-1">
                      {item.manufacturing_date 
                        ? new Date(item.manufacturing_date).toLocaleDateString()
                        : "Not detected"
                      }
                    </p>
                  </div>
                  {item.mold_cavity && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Mold Cavity</label>
                      <p className="text-base text-gray-900 mt-1">{item.mold_cavity}</p>
                    </div>
                  )}
                </div>
                
                {item.ocr_confidence_score && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-500">OCR Confidence:</label>
                      <Badge variant={item.ocr_confidence_score >= 80 ? "completed" : item.ocr_confidence_score >= 60 ? "warning" : "pending"}>
                        {item.ocr_confidence_score}%
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4 relative">
                {item.tracking_photo_url ? (
                  <>
                     <img 
                       src={item.tracking_photo_url} 
                       alt={`${item.products?.name || 'Unit'} - Unit ${item.tool_number || item.item_code}`}
                       className="w-full h-full object-cover rounded-lg"
                     />
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2"
                      onClick={async () => {
                        try {
                          const { error } = await supabase
                            .from('product_items')
                            .update({ tracking_photo_url: null })
                            .eq('id', itemId);
                          
                          if (error) throw error;
                          
                          // Invalidate query to refresh data
                          queryClient.invalidateQueries({ queryKey: ["product-item", itemId] });
                          
                          toast({
                            title: "Photo Deleted",
                            description: "Main photo has been removed successfully",
                          });
                        } catch (error) {
                          console.error('Delete error:', error);
                          toast({
                            title: "Delete Failed",
                            description: "Failed to delete photo. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : item.products?.image_url ? (
                  <img 
                    src={item.products.image_url} 
                    alt={item.products.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-center">
                    <Settings className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">No image available</p>
                  </div>
                )}
              </div>
              
              {/* QR Code Section */}
              <div className="space-y-3">
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">QR Code</span>
                  <QrCode className="w-4 h-4 text-gray-500" />
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowQRCode(true)}
                  className="w-full flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View QR Code
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Current Storage</label>
                <p className="text-base text-gray-900">
                  {item.storage_location_name}
                </p>
              </div>
              
            </CardContent>
          </Card>

           {/* Actions */}
           <Card>
             <CardHeader>
               <CardTitle>Actions</CardTitle>
             </CardHeader>
             <CardContent className="space-y-3">
                {item.status === 'maintenance' && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setMaintenanceModalTab("update");
                      setShowMaintenanceModal(true);
                    }}
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    Add Maintenance Update
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowEditModal(true)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPhotoCapture(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Profile Photo
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPhotoGallery(true)}
                >
                  <Images className="w-4 h-4 mr-2" />
                  Add / View Additional Photos
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Unified Maintenance Modal */}
        {showMaintenanceModal && (
          <UnifiedMaintenanceItemModal
            isOpen={showMaintenanceModal}
            onClose={() => setShowMaintenanceModal(false)}
            item={item}
            productId={item.product_id}
            storageLocations={storageLocations}
            activeTab={maintenanceModalTab}
          />
        )}

        {/* Edit Item Modal */}
        {showEditModal && itemId && (
          <EditItemModal
            itemId={itemId}
            onClose={() => setShowEditModal(false)}
          />
        )}

        {/* Photo Capture Modal */}
        {showPhotoCapture && (
          <UnitPhotoCapture
            open={showPhotoCapture}
            onClose={() => setShowPhotoCapture(false)}
            itemId={itemId!}
          />
        )}

        {/* Photo Gallery Modal */}
        {showPhotoGallery && (
          <UnitPhotoGallery
            open={showPhotoGallery}
            onClose={() => setShowPhotoGallery(false)}
            itemId={itemId!}
            itemCode={item.tool_number || item.item_code}
          />
        )}

        {/* QR Code Modal */}
        {showQRCode && (
          <Dialog open={showQRCode} onOpenChange={setShowQRCode}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>QR Code - {item.tool_number || item.item_code}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center p-6">
                <SimpleQRCode 
                  itemCode={item.tool_number || item.item_code}
                  showAsButton={false}
                />
              </div>
            </DialogContent>
          </Dialog>
        )}
     </div>
   );
 };

export default ProductItemDetail;