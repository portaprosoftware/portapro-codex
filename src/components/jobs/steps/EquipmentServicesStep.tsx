
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StorageLocationSelector } from '@/components/inventory/StorageLocationSelector';
import { Package, Wrench, Plus, Minus, Search, MapPin, AlertTriangle } from 'lucide-react';

interface ProductWithLocationStock {
  id: string;
  name: string;
  description?: string;
  stock_total: number;
  track_inventory: boolean;
  location_stock: Array<{
    storage_location_id: string;
    quantity: number;
    storage_location_name: string;
  }>;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  pricing_method: string;
  per_visit_cost?: number;
  per_hour_cost?: number;
}

interface EquipmentItem {
  id: string;
  name: string;
  quantity: number;
  type: 'equipment' | 'service';
  source_location_id?: string;
  source_location_name?: string;
}

interface EquipmentServicesStepProps {
  data: {
    items: EquipmentItem[];
    preferred_location_id?: string;
  };
  onUpdate: (equipment: { 
    items: EquipmentItem[];
    preferred_location_id?: string;
  }) => void;
}

export const EquipmentServicesStep: React.FC<EquipmentServicesStepProps> = ({ data, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState(data.preferred_location_id || 'all');
  
  // Real-time data fetching with React Query
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products-with-location-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_location_stock(
            storage_location_id,
            quantity,
            storage_locations(id, name)
          )
        `)
        .eq('track_inventory', true)
        .order('name');
      
      if (error) throw error;
      
      return (data || []).map((product: any) => ({
        ...product,
        location_stock: product.product_location_stock?.map((ls: any) => ({
          storage_location_id: ls.storage_location_id,
          quantity: ls.quantity,
          storage_location_name: ls.storage_locations?.name || 'Unknown Location'
        })) || []
      })) as ProductWithLocationStock[];
    }
  });

  const { data: services, isLoading: servicesLoading } = useQuery({
    queryKey: ['routine-maintenance-services'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('routine_maintenance_services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data as Service[];
    }
  });

  // Location-aware stock calculation
  const getAvailableStock = (product: ProductWithLocationStock, locationId: string) => {
    if (locationId === 'all') {
      return product.stock_total;
    }
    
    const locationStock = product.location_stock.find(ls => ls.storage_location_id === locationId);
    return locationStock?.quantity || 0;
  };

  // Get best location for a product (highest stock)
  const getBestLocation = (product: ProductWithLocationStock) => {
    if (!product.location_stock.length) return null;
    
    return product.location_stock.reduce((best, current) => 
      current.quantity > best.quantity ? current : best
    );
  };

  const addItem = (item: { 
    id: string; 
    name: string; 
    type: 'equipment' | 'service';
    product?: ProductWithLocationStock;
  }) => {
    const existingItem = data.items.find(i => i.id === item.id);
    
    let sourceLocation = null;
    if (item.type === 'equipment' && item.product) {
      if (selectedLocationId !== 'all') {
        const locationStock = item.product.location_stock.find(ls => ls.storage_location_id === selectedLocationId);
        if (locationStock) {
          sourceLocation = {
            id: locationStock.storage_location_id,
            name: locationStock.storage_location_name
          };
        }
      } else {
        const bestLocation = getBestLocation(item.product);
        if (bestLocation) {
          sourceLocation = {
            id: bestLocation.storage_location_id,
            name: bestLocation.storage_location_name
          };
        }
      }
    }
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const newItem: EquipmentItem = {
        id: item.id,
        name: item.name,
        type: item.type,
        quantity: 1,
        ...(sourceLocation && {
          source_location_id: sourceLocation.id,
          source_location_name: sourceLocation.name
        })
      };
      
      const newItems = [...data.items, newItem];
      onUpdate({ 
        ...data,
        items: newItems,
        preferred_location_id: selectedLocationId !== 'all' ? selectedLocationId : data.preferred_location_id
      });
    }
  };

  const removeItem = (itemId: string) => {
    const newItems = data.items.filter(item => item.id !== itemId);
    onUpdate({ ...data, items: newItems });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const newItems = data.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    onUpdate({ ...data, items: newItems });
  };

  const filteredProducts = products?.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredServices = services?.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getItemQuantity = (itemId: string) => {
    return data.items.find(item => item.id === itemId)?.quantity || 0;
  };

  const isLoading = productsLoading || servicesLoading;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <Package className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Equipment & Services</h2>
          <p className="text-gray-600">Loading available items...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-12 h-12 text-[#3366FF] mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Equipment & Services</h2>
        <p className="text-gray-600">Select equipment and services for this job</p>
      </div>

      {/* Storage Location Selector */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="w-4 h-4" />
            Equipment Source Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <StorageLocationSelector
            value={selectedLocationId}
            onValueChange={setSelectedLocationId}
            includeAllSites={true}
            placeholder="Select preferred source location"
          />
          <p className="text-sm text-muted-foreground mt-2">
            {selectedLocationId === 'all' 
              ? "Showing total inventory across all locations. Equipment will be sourced from the location with highest stock."
              : "Equipment will be sourced from the selected location."
            }
          </p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search equipment and services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs for Equipment vs Services */}
      <Tabs defaultValue="equipment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Equipment
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Services
          </TabsTrigger>
        </TabsList>

        <TabsContent value="equipment" className="space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredProducts.map((product) => {
              const quantity = getItemQuantity(product.id);
              const availableStock = getAvailableStock(product, selectedLocationId);
              const bestLocation = getBestLocation(product);
              
              return (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{product.name}</h4>
                    {product.description && (
                      <p className="text-sm text-gray-600">{product.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-1">
                      {selectedLocationId === 'all' ? (
                        <>
                          <span>Total Stock: {product.stock_total}</span>
                          {bestLocation && (
                            <span className="text-green-600">
                              Best Location: {bestLocation.storage_location_name} ({bestLocation.quantity} units)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <span>Available: {availableStock} units</span>
                          {availableStock === 0 && product.stock_total > 0 && (
                            <span className="text-orange-600 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Available at other locations ({product.stock_total} total)
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    {/* Location breakdown */}
                    {product.location_stock.length > 0 && selectedLocationId === 'all' && (
                      <div className="text-xs text-gray-400 mt-1">
                        Locations: {product.location_stock.map(ls => 
                          `${ls.storage_location_name} (${ls.quantity})`
                        ).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    {quantity > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Badge variant="outline" className="min-w-[40px] text-center">
                          {quantity}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="h-8 w-8 p-0"
                          disabled={quantity >= availableStock}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addItem({ 
                          id: product.id, 
                          name: product.name, 
                          type: 'equipment',
                          product: product
                        })}
                        disabled={availableStock === 0}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="services" className="space-y-3">
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredServices.map((service) => {
              const quantity = getItemQuantity(service.id);
              
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-gray-600">{service.description}</p>
                    )}
                    <div className="text-xs text-gray-500 mt-1">
                      {service.pricing_method === 'per_visit' && service.per_visit_cost && 
                        `$${service.per_visit_cost} per visit`
                      }
                      {service.pricing_method === 'per_hour' && service.per_hour_cost && 
                        `$${service.per_hour_cost} per hour`
                      }
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {quantity > 0 ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(service.id, quantity - 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Badge variant="outline" className="min-w-[40px] text-center">
                          {quantity}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(service.id, quantity + 1)}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addItem({ id: service.id, name: service.name, type: 'service' })}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Items Summary */}
      {data.items.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Selected Items ({data.items.length}):
            </span>
          </div>
          
          <div className="space-y-2">
            {data.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {item.type === 'equipment' ? (
                    <Package className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Wrench className="w-3 h-3 text-blue-600" />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm text-blue-800">{item.name}</span>
                    {item.source_location_name && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <MapPin className="w-2 h-2" />
                        From: {item.source_location_name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="border-blue-300 text-blue-700">
                    {item.quantity}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
