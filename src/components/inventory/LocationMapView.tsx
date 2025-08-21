import React from 'react';
import { SimpleInventoryMapView } from './SimpleInventoryMapView';

interface LocationMapViewProps {
  searchQuery?: string;
  selectedLocationId?: string;
  selectedProductType?: string;
}

export const LocationMapView: React.FC<LocationMapViewProps> = (props) => {
  return <SimpleInventoryMapView {...props} />;
};