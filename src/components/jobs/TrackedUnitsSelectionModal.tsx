import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Check, X } from "lucide-react";
import { AvailabilityUnit } from "@/hooks/useAvailabilityEngine";

interface SelectedUnit {
  unitId: string;
  itemCode: string;
  productId: string;
}

interface TrackedUnitsSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  units: AvailabilityUnit[];
  productName: string;
  productId: string;
  onUnitsSelect: (units: SelectedUnit[]) => void;
  onBulkSelect: () => void;
}

export function TrackedUnitsSelectionModal({
  open,
  onOpenChange,
  units,
  productName,
  productId,
  onUnitsSelect,
  onBulkSelect
}: TrackedUnitsSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(new Set());
  const [variationFilters, setVariationFilters] = useState<Record<string, string>>({});

  // Extract available variation types and values from units
  const availableVariations = useMemo(() => {
    const variations: Record<string, Set<string>> = {};
    
    units.forEach(unit => {
      if (unit.attributes) {
        Object.entries(unit.attributes).forEach(([key, value]) => {
          // Only include non-empty, non-null values and exclude winterized boolean
          if (value !== null && value !== undefined && value !== '' && key !== 'winterized') {
            const stringValue = String(value).trim();
            if (stringValue) { // Ensure the trimmed string is not empty
              if (!variations[key]) {
                variations[key] = new Set();
              }
              variations[key].add(stringValue);
            }
          }
        });
      }
    });
    
    // Convert sets to sorted arrays and capitalize variation names
    const result: Record<string, string[]> = {};
    Object.entries(variations).forEach(([key, valueSet]) => {
      const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
      result[capitalizedKey] = Array.from(valueSet).sort();
    });
    
    return result;
  }, [units]);

  // Filter units based on search term and variation filters
  const filteredUnits = useMemo(() => {
    let filtered = units;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((unit: AvailabilityUnit) => {
        return (
          unit.item_code.toLowerCase().includes(searchLower) ||
          (unit.attributes?.color && unit.attributes.color.toLowerCase().includes(searchLower)) ||
          (unit.attributes?.size && unit.attributes.size.toLowerCase().includes(searchLower)) ||
          (unit.attributes?.material && unit.attributes.material.toLowerCase().includes(searchLower))
        );
      });
    }
    
    // Apply variation filters
    Object.entries(variationFilters).forEach(([variationType, selectedValue]) => {
      if (selectedValue && selectedValue !== 'all') {
        const attributeKey = variationType.toLowerCase();
        filtered = filtered.filter((unit: AvailabilityUnit) => {
          return unit.attributes?.[attributeKey] === selectedValue;
        });
      }
    });
    
    return filtered;
  }, [units, searchTerm, variationFilters]);

  // Available units only
  const availableUnits = filteredUnits.filter(unit => unit.is_available);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'success';
      case 'assigned': return 'secondary';
      case 'maintenance': return 'destructive';
      case 'out_of_service': return 'destructive';
      default: return 'outline';
    }
  };

  const handleUnitToggle = (unitId: string) => {
    const newSelectedUnits = new Set(selectedUnits);
    if (newSelectedUnits.has(unitId)) {
      newSelectedUnits.delete(unitId);
    } else {
      newSelectedUnits.add(unitId);
    }
    setSelectedUnits(newSelectedUnits);
  };

  const handleSelectAll = () => {
    const allAvailableIds = availableUnits.map(unit => unit.item_id);
    setSelectedUnits(new Set(allAvailableIds));
  };

  const handleDeselectAll = () => {
    setSelectedUnits(new Set());
  };

  const handleConfirmSelection = () => {
    const selectedUnitsList: SelectedUnit[] = Array.from(selectedUnits).map(unitId => {
      const unit = units.find(u => u.item_id === unitId);
      return {
        unitId,
        itemCode: unit?.item_code || '',
        productId
      };
    });
    onUnitsSelect(selectedUnitsList);
    onOpenChange(false);
  };

  const handleBulkSelection = () => {
    onBulkSelect();
    onOpenChange(false);
  };

  const handleVariationFilterChange = (variationType: string, value: string) => {
    setVariationFilters(prev => ({
      ...prev,
      [variationType]: value
    }));
  };

  const resetAndClose = () => {
    setSelectedUnits(new Set());
    setSearchTerm('');
    setVariationFilters({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Select Tracked Units - {productName}
            <Badge variant="info" className="text-white">
              {availableUnits.length} available
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by item code, color, size, or material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Variation Filters */}
          {Object.keys(availableVariations).length > 0 && (
            <div className="flex flex-wrap gap-3">
              {Object.entries(availableVariations).map(([variationType, values]) => (
                <div key={variationType} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground min-w-fit">
                    {variationType}:
                  </span>
                  <Select
                    value={variationFilters[variationType] || 'all'}
                    onValueChange={(value) => handleVariationFilterChange(variationType, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder={`All ${variationType}s`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All {variationType}s</SelectItem>
                      {values.map((value) => (
                        <SelectItem key={value} value={value}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}

          {/* Selection Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                disabled={availableUnits.length === 0}
              >
                Select All Available ({availableUnits.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeselectAll}
                disabled={selectedUnits.size === 0}
              >
                Clear Selection
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedUnits.size} units selected
            </div>
          </div>

          {/* Units Grid */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredUnits.map((unit: AvailabilityUnit) => (
                <div
                  key={unit.item_id}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedUnits.has(unit.item_id)
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border'
                  } ${
                    unit.is_available 
                      ? 'cursor-pointer hover:bg-muted/50' 
                      : 'cursor-not-allowed opacity-60'
                  }`}
                  onClick={() => {
                    if (unit.is_available) {
                      handleUnitToggle(unit.item_id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {unit.item_code}
                      </div>
                      
                      {/* Status */}
                      <div className="mt-2">
                        <Badge 
                          variant={getStatusColor(unit.status)}
                          className="text-xs"
                        >
                          {unit.status}
                        </Badge>
                      </div>

                      {/* Attributes */}
                      {unit.attributes && (
                        <div className="mt-2 space-y-1">
                          {unit.attributes.color && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Color:</span> {unit.attributes.color}
                            </div>
                          )}
                          {unit.attributes.size && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Size:</span> {unit.attributes.size}
                            </div>
                          )}
                          {unit.attributes.material && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Material:</span> {unit.attributes.material}
                            </div>
                          )}
                          {unit.attributes.winterized && (
                            <div className="text-xs text-blue-600 font-medium">
                              Winterized
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {unit.is_available && (
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedUnits.has(unit.item_id)
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedUnits.has(unit.item_id) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredUnits.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                {searchTerm ? 'No units match your search criteria' : 'No tracked units available'}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBulkSelection}
            >
              Select Product in Bulk
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={resetAndClose}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedUnits.size === 0}
              >
                Add Selected Units ({selectedUnits.size})
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}