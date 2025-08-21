import React from 'react';
import { InventoryMapView } from './InventoryMapView';

interface LocationMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const LocationMapView: React.FC<LocationMapViewProps> = (props) => {
  console.log('🗺️ LocationMapView: Component mounting with props:', props);
  return <InventoryMapView {...props} />;
};