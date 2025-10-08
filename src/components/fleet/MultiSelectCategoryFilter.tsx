import React, { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Search, FileText, Shield, Users, Package, Camera, DollarSign, Archive, X } from "lucide-react";

interface Category {
  id?: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  parent_group?: string;
}

interface MultiSelectCategoryFilterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  selectedCategories: string[];
  onSelectionChange: (categories: string[]) => void;
}

const categoryGroups = [
  {
    id: "maintenance",
    name: "Maintenance & Operations",
    icon: FileText,
    color: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
    description: "Work orders, maintenance invoices, oil change records"
  },
  {
    id: "compliance",
    name: "Vehicle Ownership & Compliance",
    icon: Shield,
    color: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
    description: "Registration, insurance, permits, and inspections"
  },
  {
    id: "personnel",
    name: "Driver & Personnel",
    icon: Users,
    color: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
    description: "Driver licenses, training, incidents, and safety"
  },
  {
    id: "equipment",
    name: "Equipment & Asset Management",
    icon: Package,
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    description: "Manuals, warranties, and purchase agreements"
  },
  {
    id: "photos",
    name: "Photos & Visual Records",
    icon: Camera,
    color: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
    description: "Vehicle photos, job sites, and compliance images"
  },
  {
    id: "financial",
    name: "Financial & Administrative",
    icon: DollarSign,
    color: "bg-gradient-to-r from-amber-500 to-amber-600 text-white",
    description: "Invoices, receipts, and tax documents"
  },
  {
    id: "other",
    name: "Catch-All / Miscellaneous",
    icon: Archive,
    color: "bg-gradient-to-r from-slate-500 to-slate-600 text-white",
    description: "Temporary files and uncategorized documents"
  }
];

export const MultiSelectCategoryFilter: React.FC<MultiSelectCategoryFilterProps> = ({
  open,
  onOpenChange,
  categories,
  selectedCategories,
  onSelectionChange,
}) => {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [localSelection, setLocalSelection] = useState<string[]>(selectedCategories);

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId);
  };

  const handleCategoryToggle = (categoryName: string) => {
    setLocalSelection(prev => 
      prev.includes(categoryName)
        ? prev.filter(c => c !== categoryName)
        : [...prev, categoryName]
    );
  };

  const handleSelectAllInGroup = () => {
    if (!currentGroup) return;
    
    const groupCategories = currentGroupCategories.map(c => c.name);
    const allSelected = groupCategories.every(name => localSelection.includes(name));
    
    if (allSelected) {
      // Deselect all in this group
      setLocalSelection(prev => prev.filter(c => !groupCategories.includes(c)));
    } else {
      // Select all in this group
      setLocalSelection(prev => {
        const newSelection = [...prev];
        groupCategories.forEach(name => {
          if (!newSelection.includes(name)) {
            newSelection.push(name);
          }
        });
        return newSelection;
      });
    }
  };

  const handleBack = () => {
    setSelectedGroup(null);
  };

  const handleApply = () => {
    onSelectionChange(localSelection);
    handleClose();
  };

  const handleClearAll = () => {
    setLocalSelection([]);
  };

  const handleClose = () => {
    onOpenChange(false);
    setSelectedGroup(null);
    setSearchTerm("");
    setLocalSelection(selectedCategories); // Reset to original selection
  };

  // Get categories for the current group (filter by parent_group)
  const currentGroup = selectedGroup ? categoryGroups.find(g => g.id === selectedGroup) : null;
  const currentGroupCategories = currentGroup
    ? categories.filter(cat => cat.parent_group === currentGroup.id)
    : [];

  // Filter categories based on search term
  const filteredCategories = searchTerm.trim()
    ? categories.filter(cat =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  // Add group info to filtered categories (use parent_group)
  const filteredCategoriesWithGroup = filteredCategories.map(cat => {
    const group = categoryGroups.find(g => g.id === cat.parent_group);
    return { ...cat, groupName: group?.name, groupColor: group?.color };
  });

  // Get group with count (use parent_group field)
  const groupsWithCount = categoryGroups.map(group => ({
    ...group,
    count: categories.filter(cat => cat.parent_group === group.id).length,
    selectedCount: categories.filter(cat => cat.parent_group === group.id && localSelection.includes(cat.name)).length
  }));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedGroup && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {selectedGroup ? (
              <>
                <span className="text-lg">📄</span>
                Filter by {currentGroup?.name}
              </>
            ) : (
              <>
                <span className="text-lg">📄</span>
                Filter by Document Categories
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

          {/* Selected Count Badge */}
          {localSelection.length > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <div className="flex items-center gap-2">
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0">
                  {localSelection.length} Selected
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {localSelection.join(", ")}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-blue-600 hover:text-blue-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            </div>
          )}

          {/* Show search results if user is searching */}
          {searchTerm.trim() && filteredCategoriesWithGroup.length > 0 && (
            <div className="space-y-3 overflow-y-auto max-h-96 px-1">
              <div className="text-sm text-muted-foreground mb-3">
                Found {filteredCategoriesWithGroup.length} document type{filteredCategoriesWithGroup.length !== 1 ? 's' : ''} matching "{searchTerm}"
              </div>
              {filteredCategoriesWithGroup.map((category) => (
                <Card
                  key={category.name}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={localSelection.includes(category.name)}
                          onCheckedChange={() => handleCategoryToggle(category.name)}
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <div>
                          <span className="font-medium text-gray-900">{category.name}</span>
                          {category.groupName && (
                            <div className="text-xs text-muted-foreground mt-1">
                              from {category.groupName}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Show "no results" if searching but no matches */}
          {searchTerm.trim() && filteredCategoriesWithGroup.length === 0 && (
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

          {/* Group Selection View (only show if not searching) */}
          {!searchTerm.trim() && !selectedGroup && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-96 px-1">
              {groupsWithCount.map((group) => {
                const IconComponent = group.icon;
                return (
                  <Card
                    key={group.id}
                    className="cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] hover:bg-gray-50"
                    onClick={() => handleGroupSelect(group.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="p-3 rounded-lg bg-muted">
                          <IconComponent className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base text-gray-900 mb-1">
                            {group.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-3">
                            {group.description}
                          </p>
                          <div className="flex gap-2">
                            <Badge className={`${group.color} font-bold border-0`}>
                              {group.count} Types
                            </Badge>
                            {group.selectedCount > 0 && (
                              <Badge variant="outline" className="border-blue-500 text-blue-600">
                                {group.selectedCount} Selected
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Category Selection View (only show if group selected and not searching) */}
          {!searchTerm.trim() && selectedGroup && (
            <div className="space-y-3 overflow-y-auto max-h-96 px-1">
              {/* Select All Button */}
              <div className="flex justify-between items-center mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllInGroup}
                  className="text-sm"
                >
                  {currentGroupCategories.every(c => localSelection.includes(c.name))
                    ? "Deselect All"
                    : "Select All"}
                </Button>
              </div>

              {currentGroupCategories.map((category) => (
                <Card
                  key={category.name}
                  className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.01]"
                  onClick={() => handleCategoryToggle(category.name)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={localSelection.includes(category.name)}
                        onCheckedChange={() => handleCategoryToggle(category.name)}
                      />
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-2 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {!selectedGroup && !searchTerm.trim() && `${localSelection.length} categories selected`}
            {selectedGroup && !searchTerm.trim() && `${currentGroupCategories.filter(c => localSelection.includes(c.name)).length} of ${currentGroupCategories.length} selected`}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleApply}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
