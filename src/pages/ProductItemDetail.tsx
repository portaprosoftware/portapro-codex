import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Calendar, Settings, Camera, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/hooks/use-toast";

const ProductItemDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["product-item", itemId],
    queryFn: async () => {
      if (!itemId) throw new Error("Item ID is required");
      
      const { data, error } = await supabase
        .from("product_items")
        .select(`
          *,
          products!inner(
            id,
            name,
            image_url,
            default_price_per_day,
            description
          )
        `)
        .eq("id", itemId)
        .single();
        
      if (error) throw error;
      
      // Fetch storage location separately
      let storageLocation = null;
      if (data.current_storage_location_id) {
        const { data: location } = await supabase
          .from("storage_locations")
          .select("id, name")
          .eq("id", data.current_storage_location_id)
          .single();
        storageLocation = location;
      }
      
      return { ...data, storage_location: storageLocation };
    },
    enabled: !!itemId
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "available":
        return "bg-green-100 text-green-800";
      case "rented":
        return "bg-blue-100 text-blue-800";
      case "maintenance":
        return "bg-red-100 text-red-800";
      case "damaged":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition?.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-6">
        <LoadingSpinner />
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
              onClick={() => navigate("/inventory")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Inventory
            </Button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">
                {item.products.name}
              </h1>
              <p className="text-base text-gray-600 font-inter mt-1">
                Individual Unit: {item.tool_number || item.item_code}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getStatusColor(item.status)}>
              {item.status || "Unknown"}
            </Badge>
            {item.condition && (
              <Badge variant="outline" className={getConditionColor(item.condition)}>
                {item.condition}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
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
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <Badge className={getStatusColor(item.status)}>
                    {item.status || "Unknown"}
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

          {/* Technical Details */}
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {item.vendor_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor ID</label>
                    <p className="text-base font-mono text-gray-900">{item.vendor_id}</p>
                  </div>
                )}
                {item.plastic_code && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Plastic Code</label>
                    <p className="text-base font-mono text-gray-900">{item.plastic_code}</p>
                  </div>
                )}
                {item.manufacturing_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Manufacturing Date</label>
                    <p className="text-base text-gray-900">
                      {new Date(item.manufacturing_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {item.mold_cavity && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mold Cavity</label>
                    <p className="text-base font-mono text-gray-900">{item.mold_cavity}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* OCR Information */}
          {item.ocr_raw_data && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  OCR Detection Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {item.ocr_confidence_score && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Confidence Score</label>
                    <p className="text-base text-gray-900">
                      {Math.round(item.ocr_confidence_score * 100)}%
                    </p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Verification Status</label>
                  <Badge variant="outline" className="ml-2">
                    {item.verification_status || "Not verified"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Product Image */}
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                {item.products.image_url ? (
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
                <Button variant="outline" size="sm" className="w-full">
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
                  {item.storage_location?.name || "Unknown location"}
                </p>
              </div>
              
              {item.last_location_update && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Last Updated</label>
                  <p className="text-base text-gray-900">
                    {new Date(item.last_location_update).toLocaleDateString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                View History
              </Button>
              <Button variant="outline" className="w-full">
                <Settings className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button variant="outline" className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Take Photo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductItemDetail;