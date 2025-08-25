import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Check } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface SelectedUnit {
  unitId: string;
  itemCode: string;
  productId: string;
}

interface UnitWithAttributes {
  id: string;
  item_code: string;
  status: string;
  is_available?: boolean;
  attributes?: Record<string, any>;
}

interface TrackedUnitsPageProps {
  product: Product;
  startDate: string;
  endDate?: string | null;
  onUnitsSelect: (units: SelectedUnit[], productName: string) => void;
  onBulkSelect: (product: Product, quantity: number) => void;
  onBack: () => void;
  existingSelectedUnits?: SelectedUnit[];
}

export const TrackedUnitsPage: React.FC<TrackedUnitsPageProps> = ({
  product,
  startDate,
  endDate,
  onUnitsSelect,
  onBulkSelect,
  onBack,
  existingSelectedUnits = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Initialize with existing selected units for this product
  const [selectedUnits, setSelectedUnits] = useState<Set<string>>(() => {
    const existingForThisProduct = existingSelectedUnits
      .filter(unit => unit.productId === product.id && unit.unitId !== 'bulk')
      .map(unit => unit.unitId);
    return new Set(existingForThisProduct);
  });
  const [variationFilters, setVariationFilters] = useState<Record<string, string>>({});

  // Get set of already selected unit IDs for this product
  const alreadySelectedUnitIds = useMemo(() => {
    return new Set(existingSelectedUnits
      .filter(unit => unit.productId === product.id && unit.unitId !== 'bulk')
      .map(unit => unit.unitId)
    );
  }, [existingSelectedUnits, product.id]);

  // Fetch units with availability check for date range
  const { data: units = [], isLoading } = useQuery({
    queryKey: ["tracked-units", product.id, startDate, endDate, statusFilter],
    queryFn: async () => {
      if (!product.id) return [];
      
      let query = supabase
        .from("product_items")
        .select("id, item_code, status")
        .eq("product_id", product.id);

      // Apply status filter
      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: items, error } = await query.order("item_code");
      if (error) throw error;
      
      if (!items || items.length === 0) return [];

      // Check availability for each item if date range is provided
      const unitsWithAvailability = await Promise.all(
        items.map(async (item) => {
          let is_available = item.status === 'available';
          
          if (startDate && is_available) {
            const { data: availabilityCheck } = await supabase.rpc('check_unit_availability', {
              unit_id: item.id,
              start_date: startDate,
              end_date: endDate || startDate
            });
            is_available = availabilityCheck === true;
          }
          
          return {
            ...item,
            is_available
          };
        })
      );

      return unitsWithAvailability;
    },
    enabled: !!product.id
  });

  // Fetch item attributes for all units
  const { data: itemAttributesMap = {} } = useQuery({
    queryKey: ["item-attributes-bulk", product.id, units?.map((i: any) => i.id).join(",")],
    enabled: !!units && units.length > 0,
    queryFn: async () => {
      const ids = units.map((i: any) => i.id);
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

  // Combine units with their complete attributes
  const unitsWithCompleteAttributes: UnitWithAttributes[] = useMemo(() => {
    return units.map((unit: any) => ({
      ...unit,
      attributes: itemAttributesMap[unit.id] || {}
    }));
  }, [units, itemAttributesMap]);

  // Extract available variation types and values from units with complete attributes
  const availableVariations = useMemo(() => {
    const variations: Record<string, Set<string>> = {};
    
    unitsWithCompleteAttributes.forEach(unit => {
      if (unit.attributes) {
        Object.entries(unit.attributes).forEach(([key, value]) => {
          // Only include non-empty, non-null values and exclude winterized boolean
          if (value !== null && value !== undefined && value !== '' && key !== 'winterized') {
            const stringValue = String(value).trim();
            if (stringValue) {
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
  }, [unitsWithCompleteAttributes]);

  // Filter units based on search term and variation filters
  const filteredUnits = useMemo(() => {
    let filtered = unitsWithCompleteAttributes;
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((unit: UnitWithAttributes) => {
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
        filtered = filtered.filter((unit: UnitWithAttributes) => {
          return unit.attributes?.[attributeKey] === selectedValue;
        });
      }
    });
    
    return filtered;
  }, [unitsWithCompleteAttributes, searchTerm, variationFilters]);

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
    // Only select units that are available and not already selected
    const availableAndNotSelectedIds = availableUnits
      .filter(unit => !alreadySelectedUnitIds.has(unit.id))
      .map(unit => unit.id);
    setSelectedUnits(new Set(availableAndNotSelectedIds));
  };

  const handleDeselectAll = () => {
    setSelectedUnits(new Set());
  };

  const handleConfirmSelection = () => {
    const selectedUnitsList: SelectedUnit[] = Array.from(selectedUnits).map(unitId => {
      const unit = unitsWithCompleteAttributes.find(u => u.id === unitId);
      return {
        unitId,
        itemCode: unit?.item_code || '',
        productId: product.id
      };
    });
    onUnitsSelect(selectedUnitsList, product.name);
  };

  const handleBulkSelection = () => {
    onBulkSelect(product, 1); // Default quantity of 1 for bulk from tracked units page
    onBack();
  };

  const handleVariationFilterChange = (variationType: string, value: string) => {
    setVariationFilters(prev => ({
      ...prev,
      [variationType]: value
    }));
  };

  return (
    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
      {/* Search and Status Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by item code, color, size, or material..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 bg-white">
            <SelectValue placeholder="All Availability" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Availability</SelectItem>
            <SelectItem value="available">Available</SelectItem>
            <SelectItem value="assigned">On Job</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="out_of_service">Permanently Retired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Variation Filters */}
      {Object.keys(availableVariations).length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
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
          {Object.values(variationFilters).some(filter => filter && filter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setVariationFilters({})}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Filters
            </Button>
          )}
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
          {filteredUnits.map((unit: UnitWithAttributes) => {
            const isAlreadySelected = alreadySelectedUnitIds.has(unit.id);
            const isClickable = unit.is_available && !isAlreadySelected;
            
            return (
              <div
                key={unit.id}
                className={`p-3 rounded-lg border transition-all ${
                  selectedUnits.has(unit.id)
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border'
                } ${
                  isAlreadySelected
                    ? 'cursor-not-allowed opacity-40 bg-muted/50'
                    : isClickable 
                      ? 'cursor-pointer hover:bg-muted/50' 
                      : 'cursor-not-allowed opacity-60'
                }`}
                onClick={() => {
                  if (isClickable) {
                    handleUnitToggle(unit.id);
                  }
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {unit.item_code}
                      {isAlreadySelected && (
                        <span className="ml-2 text-xs text-muted-foreground">(Already Selected)</span>
                      )}
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
                    {unit.attributes && Object.keys(unit.attributes).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(unit.attributes).map(([key, value]) => {
                          if (key === 'winterized' && value) {
                            return (
                              <div key={key} className="text-xs text-blue-600 font-medium">
                                Winterized
                              </div>
                            );
                          }
                          if (value && key !== 'winterized') {
                            return (
                              <div key={key} className="text-xs text-muted-foreground">
                                <span className="font-medium capitalize">{key}:</span> {value}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selection Indicator */}
                  {!isAlreadySelected && unit.is_available && (
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedUnits.has(unit.id)
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-muted-foreground'
                    }`}>
                      {selectedUnits.has(unit.id) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isLoading && (
          <div className="text-center text-muted-foreground py-8">
            Loading units...
          </div>
        )}

        {!isLoading && filteredUnits.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No units match your search criteria' : 'No tracked units available'}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button
          variant="outline"
          onClick={onBack}
        >
          Back to Products
        </Button>
        <Button
          onClick={handleConfirmSelection}
          disabled={selectedUnits.size === 0}
        >
          Add Selected Units ({selectedUnits.size})
        </Button>
      </div>
    </div>
  );
};