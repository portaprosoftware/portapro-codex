import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Search } from "lucide-react";

interface VehicleTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTypeSelect: (typeId: string, typeName: string) => void;
  selectedTypeId?: string;
}

const vehicleTypeCategories = [
  {
    id: "light",
    name: "🚚 Light & Utility Vehicles",
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    types: [
      { id: "pickup", name: "Pickup Truck" },
      { id: "cargo-van", name: "Cargo Van" },
      { id: "service-truck", name: "Service / Utility Truck" },
      { id: "suv-car", name: "SUV / Car" },
    ]
  },
  {
    id: "heavy",
    name: "🚛 Heavy & Fleet Vehicles",
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    types: [
      { id: "box-truck", name: "Box Truck / Straight Truck" },
      { id: "flatbed-truck", name: "Flatbed Truck" },
      { id: "semi-truck", name: "Semi-Truck / Tractor" },
      { id: "dump-truck", name: "Dump Truck" },
      { id: "step-van", name: "Step Van / Delivery Van" },
      { id: "bus", name: "Bus / Shuttle" },
    ]
  },
  {
    id: "sanitation",
    name: "🧼 Sanitation & Waste Vehicles",
    color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    types: [
      { id: "vacuum-truck", name: "Vacuum Truck" },
      { id: "pumper-truck", name: "Pumper Truck (portable toilet service truck)" },
      { id: "septic-tank-truck", name: "Septic Tank Truck" },
      { id: "combination-unit", name: "Combination Unit (Vac + Jet)" },
      { id: "sludge-tanker", name: "Sludge Tanker" },
      { id: "grease-trap-truck", name: "Grease Trap Pump Truck" },
    ]
  },
  {
    id: "trailers",
    name: "🛻 Trailers",
    color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    types: [
      { id: "enclosed-trailer", name: "Enclosed Trailer" },
      { id: "flatbed-trailer", name: "Flatbed Trailer" },
      { id: "tank-trailer", name: "Tank Trailer (waste hauling)" },
      { id: "vacuum-trailer", name: "Vacuum Trailer" },
      { id: "lowboy-trailer", name: "Lowboy Trailer" },
    ]
  },
  {
    id: "other",
    name: "🛠️ Other / Special",
    color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    types: [
      { id: "golf-cart", name: "Golf Cart / Utility Cart" },
      { id: "atv", name: "ATV / UTV" },
      { id: "heavy-equipment", name: "Heavy Equipment (loader, backhoe, etc.)" },
      { id: "custom", name: "Custom" },
    ]
  }
];

export const VehicleTypeSelector: React.FC<VehicleTypeSelectorProps> = ({
  open,
  onOpenChange,
  onTypeSelect,
  selectedTypeId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleTypeSelect = (type: { id: string; name: string }) => {
    onTypeSelect(type.id, type.name);
    onOpenChange(false);
    setSelectedCategory(null);
    setSelectedType(null);
    setSearchTerm("");
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setSelectedType(null);
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedCategory(null);
    setSelectedType(null);
    setSearchTerm("");
  };

  // Get all types from all categories for search
  const allTypes = vehicleTypeCategories.flatMap(category => 
    category.types.map(type => ({
      ...type,
      categoryId: category.id,
      categoryName: category.name,
      categoryColor: category.color
    }))
  );

  // Filter types based on search term
  const filteredTypes = searchTerm.trim() 
    ? allTypes.filter(type => 
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.categoryName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const currentCategory = selectedCategory ? vehicleTypeCategories.find(cat => cat.id === selectedCategory) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedCategory && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedCategory ? (
              <>
                {currentCategory?.name}
              </>
            ) : (
              <>
                Select Vehicle Category
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vehicle type across all categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show search results if user is searching */}
          {searchTerm.trim() && filteredTypes.length > 0 && (
            <div className="space-y-3 overflow-y-auto max-h-96 px-1">
              <div className="text-sm text-muted-foreground mb-3">
                Found {filteredTypes.length} vehicle type{filteredTypes.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
              {filteredTypes.map((type) => (
                <Card
                  key={`${type.categoryId}-${type.id}`}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                    selectedType?.id === type.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleTypeSelect(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <span className="font-medium text-gray-900">{type.name}</span>
                          <div className="text-xs text-muted-foreground mt-1">
                            from {type.categoryName}
                          </div>
                        </div>
                      </div>
                      {selectedType?.id === type.id && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Show "no results" if searching but no matches */}
          {searchTerm.trim() && filteredTypes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No vehicle types found matching "{searchTerm}"</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm("")}
                className="mt-2"
              >
                Clear Search
              </Button>
            </div>
          )}

          {/* Category Selection View (only show if not searching) */}
          {!searchTerm.trim() && !selectedCategory && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-96 px-1">
              {vehicleTypeCategories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-gray-50"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-6 text-center">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {category.name}
                    </h3>
                    <Badge className={category.color}>
                      {category.types.length} types
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Type Selection View (only show if category selected and not searching) */}
          {!searchTerm.trim() && selectedCategory && (
            <div className="space-y-3 overflow-y-auto max-h-96 px-1">
              {currentCategory?.types.map((type) => (
                <Card
                  key={type.id}
                  className={`cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${
                    selectedType?.id === type.id
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleTypeSelect(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{type.name}</span>
                      </div>
                      {selectedType?.id === type.id && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {searchTerm.trim() ? (
              <>
                {filteredTypes.length} result{filteredTypes.length !== 1 ? 's' : ''} found
              </>
            ) : selectedCategory ? (
              <>
                {currentCategory?.types.length} types in {currentCategory?.name}
              </>
            ) : (
              <>
                {vehicleTypeCategories.length} categories available
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};