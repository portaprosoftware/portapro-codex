import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, MapPin } from "lucide-react";

interface StorageLocation {
  id: string;
  name: string;
  description?: string;
  address_type: 'company_address' | 'custom' | 'gps';
  custom_street?: string;
  custom_city?: string;
  custom_state?: string;
  gps_coordinates?: { x: number; y: number };
  is_default: boolean;
  is_active: boolean;
}

interface StorageLocationSelectorProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  activeOnly?: boolean;
  includeAllSites?: boolean;
  excludeLocationId?: string;
}

export function StorageLocationSelector({
  value,
  onValueChange,
  placeholder = "Select storage site",
  disabled = false,
  activeOnly = true,
  includeAllSites = false,
  excludeLocationId
}: StorageLocationSelectorProps) {
  const { data: storageLocations, isLoading } = useQuery({
    queryKey: ['storage-locations', { activeOnly }],
    queryFn: async () => {
      let query = supabase
        .from('storage_locations')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      
      if (activeOnly) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as StorageLocation[];
    }
  });

  const formatLocationDisplay = (location: StorageLocation) => {
    let addressInfo = "";
    
    if (location.address_type === 'company_address') {
      addressInfo = "Company Address";
    } else if (location.address_type === 'gps') {
      addressInfo = location.gps_coordinates 
        ? `GPS: ${location.gps_coordinates.y.toFixed(4)}, ${location.gps_coordinates.x.toFixed(4)}`
        : "GPS Coordinates";
    } else if (location.custom_city && location.custom_state) {
      addressInfo = `${location.custom_city}, ${location.custom_state}`;
    }

    return {
      name: location.name,
      address: addressInfo,
      isDefault: location.is_default
    };
  };

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled || isLoading}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={isLoading ? "Loading..." : placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-white z-50">
        {includeAllSites && (
          <SelectItem value="all">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span>All Sites</span>
            </div>
          </SelectItem>
        )}
        
        {storageLocations?.filter(location => location.id !== excludeLocationId).map((location) => {
          const display = formatLocationDisplay(location);
          return (
            <SelectItem key={location.id} value={location.id}>
              <div className="flex items-center gap-2 w-full">
                <Building className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{display.name}</span>
                    {display.isDefault && (
                      <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded">
                        Default
                      </span>
                    )}
                  </div>
                  {display.address && (
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {display.address}
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          );
        })}
        
        {storageLocations?.length === 0 && !isLoading && (
          <SelectItem value="no-locations" disabled>
            <span className="text-muted-foreground">No storage locations found</span>
          </SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}