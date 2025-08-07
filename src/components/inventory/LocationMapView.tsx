import React, { useState } from 'react';
import { InventoryMapView } from './InventoryMapView';
import { InventoryFilters } from './InventoryFilters';

type FilterType = "all" | "in_stock" | "low_stock" | "out_of_stock" | "available_now";

export const LocationMapView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
      />
      
      <InventoryMapView />
    </div>
  );
};