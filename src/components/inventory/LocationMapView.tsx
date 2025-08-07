import React, { useState } from 'react';
import { InventoryMapView } from './InventoryMapView';
import { InventoryFilters } from './InventoryFilters';

export const LocationMapView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState('all');

  return (
    <div className="space-y-6">
      {/* Search and Filters Card */}
      <InventoryFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedLocationId={selectedLocationId}
        onLocationChange={setSelectedLocationId}
      />
      
      <InventoryMapView />
    </div>
  );
};