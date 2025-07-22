
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Wrench, Plus, Minus, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  stock_total: number;
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
}

interface EquipmentServicesStepProps {
  data: {
    items: EquipmentItem[];
  };
  onUpdate: (equipment: { items: EquipmentItem[]; }) => void;
}

export const EquipmentServicesStep: React.FC<EquipmentServicesStepProps> = ({ data, onUpdate }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProductsAndServices();
  }, []);

  const fetchProductsAndServices = async () => {
    try {
      // Mock data for now - replace with actual Supabase calls later
      const mockProducts: Product[] = [
        { id: '1', name: 'Standard Portable Toilet', description: 'Basic portable toilet unit', stock_total: 25 },
        { id: '2', name: 'Deluxe Portable Toilet', description: 'Enhanced portable toilet with hand sanitizer', stock_total: 15 },
        { id: '3', name: 'Handicap Accessible Unit', description: 'ADA compliant portable toilet', stock_total: 8 },
        { id: '4', name: 'Hand Wash Station', description: 'Portable hand washing station', stock_total: 12 }
      ];

      const mockServices: Service[] = [
        { id: '1', name: 'Weekly Service', description: 'Weekly cleaning and restocking', pricing_method: 'per_visit', per_visit_cost: 25 },
        { id: '2', name: 'Bi-weekly Service', description: 'Bi-weekly cleaning and restocking', pricing_method: 'per_visit', per_visit_cost: 35 },
        { id: '3', name: 'Emergency Service', description: 'Emergency cleaning service', pricing_method: 'per_hour', per_hour_cost: 75 },
        { id: '4', name: 'Deep Clean Service', description: 'Thorough deep cleaning service', pricing_method: 'per_visit', per_visit_cost: 50 }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      setProducts(mockProducts);
      setServices(mockServices);
    } catch (error) {
      console.error('Error fetching products and services:', error);
    } finally {
      setLoading(false);
    }
  };

  const addItem = (item: { id: string; name: string; type: 'equipment' | 'service' }) => {
    const existingItem = data.items.find(i => i.id === item.id);
    
    if (existingItem) {
      updateQuantity(item.id, existingItem.quantity + 1);
    } else {
      const newItems = [...data.items, { ...item, quantity: 1 }];
      onUpdate({ items: newItems });
    }
  };

  const removeItem = (itemId: string) => {
    const newItems = data.items.filter(item => item.id !== itemId);
    onUpdate({ items: newItems });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    const newItems = data.items.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    );
    onUpdate({ items: newItems });
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getItemQuantity = (itemId: string) => {
    return data.items.find(item => item.id === itemId)?.quantity || 0;
  };

  if (loading) {
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
                    <div className="text-xs text-gray-500 mt-1">
                      Stock: {product.stock_total} available
                    </div>
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
                          disabled={quantity >= product.stock_total}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addItem({ id: product.id, name: product.name, type: 'equipment' })}
                        disabled={product.stock_total === 0}
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
                  <span className="text-sm text-blue-800">{item.name}</span>
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
