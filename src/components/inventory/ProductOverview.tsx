import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Edit, Settings } from "lucide-react";


interface Product {
  id: string;
  name: string;
  default_price_per_day: number;
  description?: string;
  stock_total: number;
  stock_in_service: number;
  low_stock_threshold: number;
  track_inventory: boolean;
}

interface ProductOverviewProps {
  product: Product;
}

export const ProductOverview: React.FC<ProductOverviewProps> = ({ product }) => {
  const availableCount = product.stock_total - product.stock_in_service;
  const maintenanceCount = 0; // This would come from maintenance records
  const reservedCount = 0; // This would come from reservations

  const statusData = [
    { label: "Available", count: availableCount, color: "bg-green-500", textColor: "text-green-700" },
    { label: "On Job", count: product.stock_in_service, color: "bg-blue-500", textColor: "text-blue-700" },
    { label: "Maintenance", count: maintenanceCount, color: "bg-amber-500", textColor: "text-amber-700" },
    { label: "Reserved", count: reservedCount, color: "bg-red-500", textColor: "text-red-700" },
  ];

  const isLowStock = availableCount <= product.low_stock_threshold;

  return (
    <div className="space-y-6">
      {/* Product Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <Badge className="bg-blue-600 text-white">${product.default_price_per_day}/day</Badge>
              <Badge variant="outline" className="text-green-700 border-green-300">
                (Available)
              </Badge>
            </div>
            <p className="text-gray-600 leading-relaxed">
              {product.description || "A portable toilet designed to meet the accessibility standards of the Americans with Disabilities Act (ADA). These units are designed to be accessible to individuals with disabilities, particularly those using wheelchairs, and feature wider doorways, spacious interiors, and reinforced grab bars, among other features"}
            </p>
          </div>
          <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
            <Edit className="w-4 h-4 mr-2" />
            Edit Product Info
          </Button>
        </div>
      </div>

      {/* Inventory Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Inventory Status</h2>
          <div className="flex items-center gap-4">
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <Settings className="w-4 h-4 mr-2" />
              Adjust Stock
            </Button>
            <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50">
              <Edit className="w-4 h-4 mr-2" />
              Move to Maintenance
            </Button>
            {isLowStock && (
              <Button className="bg-amber-500 text-white hover:bg-amber-600">
                <Settings className="w-4 h-4 mr-2" />
                Low Stock: {product.low_stock_threshold}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Status List */}
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.label} className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                <span className="font-medium text-gray-900">{status.count}</span>
                <span className={`font-medium ${status.textColor}`}>{status.label}</span>
              </div>
            ))}
          </div>

          {/* Status Bars */}
          <div className="space-y-4">
            {statusData.map((status) => (
              <div key={status.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className={status.textColor}>{status.label}</span>
                  <span className="text-gray-600">{status.count}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${status.color} transition-all duration-300`}
                    style={{ width: `${(status.count / product.stock_total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-right text-sm text-gray-600">
          Total: {product.stock_total}
        </div>
      </div>

      {/* Disable Tracking */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900 mb-1">Disable tracking</h3>
            <p className="text-sm text-gray-600">Toggle switch to disable or enable tracking for this item</p>
          </div>
          <Switch
            checked={!product.track_inventory}
            className="data-[state=checked]:bg-gray-600"
          />
        </div>
      </div>
    </div>
  );
};