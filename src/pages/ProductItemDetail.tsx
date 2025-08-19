import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Settings, Camera, QrCode, History, Edit, MoveRight, Wrench, ChevronRight, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UnitActivityTimeline } from "@/components/inventory/UnitActivityTimeline";
import { MaintenanceHistoryModal } from "@/components/inventory/MaintenanceHistoryModal";
import { SimpleQRCode } from "@/components/inventory/SimpleQRCode";
import { UnitPhotoCapture } from "@/components/inventory/UnitPhotoCapture";

const ProductItemDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Modal states
  const [showMaintenanceHistory, setShowMaintenanceHistory] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);

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

  // Helper function to capitalize first letter
  const capitalizeFirstLetter = (str: string) => {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

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

  const getConditionVariant = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
        return "completed";
      case "good":
        return "assigned";
      case "fair":
        return "warning";
      case "poor":
        return "warning";
      case "damaged":
        return "cancelled";
      default:
        return "pending";
    }
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
              onClick={() => navigate(`/inventory/products/${item.product_id}?tab=units&toolNumberToFind=${item.tool_number || item.item_code}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to Product
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
                  onClick={() => navigate(`/inventory/products/${item.product_id}?tab=units&toolNumberToFind=${item.tool_number || item.item_code}`)}
                >
                  {item.products.name}
                </Button>
                <ChevronRight className="w-3 h-3" />
                <span className="text-gray-700 font-medium">Individual Unit</span>
              </div>
              
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">
                {item.products.name}
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
                  <p className="text-base font-medium text-gray-900">{item.products.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-base text-gray-900">{item.products.description || "No description"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Tool Number</label>
                  <p className="text-base font-mono text-gray-900">{item.tool_number || "Not assigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Item Code</label>
                  <p className="text-base font-mono text-gray-900">{item.item_code}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Rental Price</label>
                  <p className="text-base font-medium text-gray-900">${item.products.default_price_per_day}/day</p>
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
                {item.vendor_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                    <p className="text-base font-mono text-gray-900">{item.vendor_id}</p>
                  </div>
                )}
                {item.condition && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Condition</label>
                    <Badge variant={getConditionVariant(item.condition)}>
                      {capitalizeFirstLetter(item.condition)}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {item.tracking_photo_url ? (
                  <img 
                    src={item.tracking_photo_url} 
                    alt={`${item.products.name} - Unit ${item.tool_number || item.item_code}`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : item.products.image_url ? (
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
                <SimpleQRCode 
                  itemCode={item.tool_number || item.item_code}
                  showAsButton={true}
                />
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
               <Button 
                 variant="outline" 
                 className="w-full"
                 onClick={() => setShowMaintenanceHistory(true)}
               >
                 <History className="w-4 h-4 mr-2" />
                 View Maintenance History
               </Button>
               <Button variant="outline" className="w-full">
                 <Wrench className="w-4 h-4 mr-2" />
                 Add Maintenance Update
               </Button>
               <Button variant="outline" className="w-full">
                 <MoveRight className="w-4 h-4 mr-2" />
                 Transfer Location
               </Button>
               <Button variant="outline" className="w-full">
                 <Edit className="w-4 h-4 mr-2" />
                 Edit Item Details
               </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setShowPhotoCapture(true)}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
             </CardContent>
           </Card>
         </div>
       </div>

       {/* Maintenance History Modal */}
       {showMaintenanceHistory && (
         <MaintenanceHistoryModal
           isOpen={showMaintenanceHistory}
           onClose={() => setShowMaintenanceHistory(false)}
           itemId={itemId!}
           itemCode={item.tool_number || item.item_code}
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
     </div>
   );
 };

export default ProductItemDetail;