// Product type definitions and utilities for PortaPro

export type ProductType = 
  | 'standard_toilet'
  | 'ada_toilet' 
  | 'deluxe_toilet'
  | 'high_rise_toilet'
  | 'handwashing_station_single'
  | 'handwashing_station_double'
  | 'restroom_trailer'
  | 'shower_trailer'
  | 'holding_tank'
  | 'urinal_stand'
  | 'sanitizer_stand'
  | 'accessories'
  | 'custom';

export interface ProductTypeInfo {
  value: ProductType;
  label: string;
  description: string;
  category: 'toilets' | 'handwashing' | 'trailers' | 'tanks' | 'accessories';
}

export const PRODUCT_TYPES: ProductTypeInfo[] = [
  {
    value: 'standard_toilet',
    label: 'Standard Toilet',
    description: 'Regular portable toilet units',
    category: 'toilets'
  },
  {
    value: 'ada_toilet',
    label: 'ADA Toilet',
    description: 'Handicap accessible portable toilet units',
    category: 'toilets'
  },
  {
    value: 'deluxe_toilet',
    label: 'Deluxe Toilet',
    description: 'Premium flushable portable toilet units',
    category: 'toilets'
  },
  {
    value: 'high_rise_toilet',
    label: 'High-Rise Toilet',
    description: 'Portable toilets designed for construction sites',
    category: 'toilets'
  },
  {
    value: 'handwashing_station_single',
    label: 'Single Handwashing Station',
    description: 'Single sink handwashing stations',
    category: 'handwashing'
  },
  {
    value: 'handwashing_station_double',
    label: 'Double Handwashing Station',
    description: 'Double sink handwashing stations',
    category: 'handwashing'
  },
  {
    value: 'restroom_trailer',
    label: 'Restroom Trailer',
    description: 'Luxury and multi-stall trailer units',
    category: 'trailers'
  },
  {
    value: 'shower_trailer',
    label: 'Shower Trailer',
    description: 'Mobile shower facilities',
    category: 'trailers'
  },
  {
    value: 'holding_tank',
    label: 'Holding Tank',
    description: 'Wastewater and fresh water holding tanks',
    category: 'tanks'
  },
  {
    value: 'urinal_stand',
    label: 'Urinal Stand',
    description: 'Standalone urinal units',
    category: 'accessories'
  },
  {
    value: 'sanitizer_stand',
    label: 'Sanitizer Stand',
    description: 'Hand sanitizer dispensing stations',
    category: 'accessories'
  },
  {
    value: 'accessories',
    label: 'Accessories',
    description: 'Additional equipment and add-ons',
    category: 'accessories'
  },
  {
    value: 'custom',
    label: 'Custom',
    description: 'Custom or specialized equipment',
    category: 'accessories'
  }
];

export const getProductTypeLabel = (type: ProductType): string => {
  const productType = PRODUCT_TYPES.find(pt => pt.value === type);
  return productType?.label || type;
};

export const getProductTypeInfo = (type: ProductType): ProductTypeInfo | undefined => {
  return PRODUCT_TYPES.find(pt => pt.value === type);
};

export const getProductTypesByCategory = (category: ProductTypeInfo['category']): ProductTypeInfo[] => {
  return PRODUCT_TYPES.filter(pt => pt.category === category);
};

export const getAllProductTypeValues = (): ProductType[] => {
  return PRODUCT_TYPES.map(pt => pt.value);
};