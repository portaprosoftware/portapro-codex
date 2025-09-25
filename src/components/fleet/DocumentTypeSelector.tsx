import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, Search } from "lucide-react";

interface DocumentTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDocumentTypeSelect: (typeId: string, typeName: string) => void;
  selectedTypeId?: string;
}

const documentCategories = [
  {
    id: "compliance-regulatory",
    name: "Compliance & Regulatory",
    icon: "🧾",
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    description: "Government, DOT, and waste permits",
    types: [
      { id: "annual-dot-inspection", name: "Annual DOT Inspection" },
      { id: "dot-fmcsa-dvir-log", name: "DOT/FMCSA DVIR Log" },
      { id: "dot-permit", name: "DOT Permit" },
      { id: "emissions-certificate", name: "Emissions Certificate" },
      { id: "state-septage-hauler-permit", name: "State Septage Hauler Permit" },
      { id: "wwtp-disposal-manifest", name: "WWTP Disposal Manifest" },
    ]
  },
  {
    id: "safety-training",
    name: "Safety & Training",
    icon: "🛡️",
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    description: "Training, spill kits, PPE, and safety data",
    types: [
      { id: "bloodborne-pathogens-training", name: "Bloodborne Pathogens Training" },
      { id: "ppe-training-certificate", name: "PPE Training Certificate" },
      { id: "spill-kit-inspection-record", name: "Spill Kit Inspection Record" },
      { id: "sds-on-board", name: "SDS On Board (Safety Data Sheets)" },
    ]
  },
  {
    id: "licensing-registration",
    name: "Licensing & Registration",
    icon: "📑",
    color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    description: "Permits to operate and certifications",
    types: [
      { id: "commercial-license", name: "Commercial License" },
      { id: "registration", name: "Registration" },
      { id: "tank-leakproof-certification", name: "Tank Leakproof Certification" },
    ]
  },
  {
    id: "insurance-inspection",
    name: "Insurance & Inspection",
    icon: "📋",
    color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    description: "Coverage and routine checks",
    types: [
      { id: "insurance", name: "Insurance" },
      { id: "inspection", name: "General Inspection (non-DOT specific)" },
    ]
  }
];

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  open,
  onOpenChange,
  onDocumentTypeSelect,
  selectedTypeId,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<{ id: string; name: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleTypeSelect = (type: { id: string; name: string }) => {
    onDocumentTypeSelect(type.id, type.name);
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
  const allTypes = documentCategories.flatMap(category => 
    category.types.map(type => ({
      ...type,
      categoryId: category.id,
      categoryName: category.name,
      categoryIcon: category.icon,
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

  const currentCategory = selectedCategory ? documentCategories.find(cat => cat.id === selectedCategory) : null;

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
                <span className="text-2xl">{currentCategory?.icon}</span>
                Select Document Type from {currentCategory?.name}
              </>
            ) : (
              <>
                📑 Select Document Category
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search document type across all categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Show search results if user is searching */}
          {searchTerm.trim() && filteredTypes.length > 0 && (
            <div className="space-y-3 overflow-y-auto max-h-96 px-1">
              <div className="text-sm text-muted-foreground mb-3">
                Found {filteredTypes.length} document type{filteredTypes.length !== 1 ? 's' : ''} matching "{searchTerm}"
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
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-lg">{type.categoryIcon}</span>
                        </div>
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
              <p>No document types found matching "{searchTerm}"</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-96 px-1">
              {documentCategories.map((category) => (
                <Card
                  key={category.id}
                  className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-gray-50"
                  onClick={() => handleCategorySelect(category.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{category.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {category.description}
                        </p>
                        <Badge className={category.color}>
                          {category.types.length} types
                        </Badge>
                      </div>
                    </div>
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
                        <div className="w-8 h-8 flex items-center justify-center">
                          <span className="text-lg">{currentCategory.icon}</span>
                        </div>
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
                {documentCategories.length} categories available
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