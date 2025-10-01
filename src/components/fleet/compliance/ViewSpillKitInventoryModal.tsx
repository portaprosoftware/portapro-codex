import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { Package, MapPin, Truck, FileText, Clock, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

type ViewSpillKitInventoryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  itemId: string;
};

export function ViewSpillKitInventoryModal({ isOpen, onClose, itemId }: ViewSpillKitInventoryModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch inventory item details
  const { data: item } = useQuery({
    queryKey: ['spill-kit-inventory-item', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('*')
        .eq('id', itemId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!itemId,
  });

  // Fetch storage locations
  const { data: locationStock } = useQuery({
    queryKey: ['spill-kit-location-stock', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('spill_kit_location_stock')
        .select('*')
        .eq('inventory_item_id', itemId);
      if (error) throw error;
      
      // Fetch location names separately
      if (data && data.length > 0) {
        const locationIds = data.map(s => s.storage_location_id);
        const { data: locations } = await supabase
          .from('spill_kit_storage_locations')
          .select('id, name, description')
          .in('id', locationIds);
        
        return data.map(stock => ({
          ...stock,
          location_name: locations?.find(l => l.id === stock.storage_location_id)?.name || 'Unknown',
          location_description: locations?.find(l => l.id === stock.storage_location_id)?.description || '',
        }));
      }
      return data;
    },
    enabled: !!itemId,
  });

  // Fetch assigned vehicles
  const { data: assignedVehicles } = useQuery({
    queryKey: ['spill-kit-assigned-vehicles', itemId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kits')
        .select('id, vehicle_id, required_contents, updated_at')
        .eq('active', true);
      
      if (error) throw error;
      
      // Filter vehicles that have this item in their required_contents
      const filtered = data?.filter(vsk => {
        const contents = vsk.required_contents as Array<{
          inventory_item_id: string;
          item_name: string;
          quantity_required: number;
        }>;
        return contents?.some(c => c.inventory_item_id === itemId);
      });

      if (!filtered || filtered.length === 0) return [];

      // Fetch vehicle details separately
      const vehicleIds = filtered.map(v => v.vehicle_id);
      const { data: vehicles } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model')
        .in('id', vehicleIds);

      // Map to include quantity required
      return filtered.map(vsk => {
        const contents = vsk.required_contents as Array<{
          inventory_item_id: string;
          item_name: string;
          quantity_required: number;
        }>;
        const itemContent = contents.find(c => c.inventory_item_id === itemId);
        const vehicle = vehicles?.find(v => v.id === vsk.vehicle_id);
        
        return {
          vehicleId: vsk.vehicle_id,
          licensePlate: vehicle?.license_plate,
          make: vehicle?.make,
          model: vehicle?.model,
          quantityRequired: itemContent?.quantity_required || 0,
          lastUpdated: vsk.updated_at,
        };
      });
    },
    enabled: !!itemId,
  });

  if (!item) return null;

  const getStatusBadge = () => {
    if (item.expiration_date && new Date(item.expiration_date) < new Date()) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold">Expired</Badge>;
    }
    if (item.is_critical && item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold">Critical Missing</Badge>;
    }
    if (item.current_stock === 0) {
      return <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600 text-white font-bold">Out of Stock</Badge>;
    }
    if (item.current_stock <= item.minimum_threshold) {
      return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">Low Stock</Badge>;
    }
    return <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold">In Stock</Badge>;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'absorbent': 'Absorbents',
      'containment': 'Containment & Control',
      'ppe': 'PPE',
      'decon': 'Decon & Cleaning',
      'tools': 'Tools & Hardware',
      'disposal': 'Disposal & Packaging',
      'documentation': 'Documentation & Labels',
      'pump_transfer': 'Pump / Transfer',
      'signage': 'Signage & Safety',
      'other': 'General / Other'
    };
    return labels[type] || type;
  };

  const stockPercentage = (item.current_stock / Math.max(item.minimum_threshold * 2, 1)) * 100;
  const totalValue = item.current_stock * item.unit_cost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl">{item.item_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                {getStatusBadge()}
                {item.is_critical && (
                  <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold">Critical</Badge>
                )}
                <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold">
                  {getTypeLabel(item.item_type)}
                </Badge>
              </div>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">
              <Package className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="locations">
              <MapPin className="h-4 w-4 mr-2" />
              Locations
            </TabsTrigger>
            <TabsTrigger value="vehicles">
              <Truck className="h-4 w-4 mr-2" />
              Vehicles ({assignedVehicles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="supplier">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Supplier
            </TabsTrigger>
            <TabsTrigger value="usage">
              <Clock className="h-4 w-4 mr-2" />
              Usage
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Current Stock</div>
                  <div className="text-3xl font-bold">{item.current_stock}</div>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Min: {item.minimum_threshold}</span>
                      <span>{stockPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          item.current_stock <= item.minimum_threshold 
                            ? 'bg-gradient-to-r from-red-400 to-red-600' 
                            : 'bg-gradient-to-r from-green-400 to-emerald-500'
                        }`}
                        style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Total Value</div>
                  <div className="text-3xl font-bold">${totalValue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    ${item.unit_cost.toFixed(2)} per unit
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Reorder Quantity</div>
                  <div className="text-3xl font-bold">{item.reorder_quantity}</div>
                  <div className="text-sm text-muted-foreground mt-2">
                    Est. Cost: ${(item.reorder_quantity * item.unit_cost).toFixed(2)}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm text-muted-foreground mb-1">Expiration Date</div>
                  <div className={`text-xl font-bold ${
                    item.expiration_date && new Date(item.expiration_date) < new Date() 
                      ? 'text-red-600' 
                      : item.expiration_date && new Date(item.expiration_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                      ? 'text-orange-500'
                      : ''
                  }`}>
                    {item.expiration_date ? format(new Date(item.expiration_date), 'MMM dd, yyyy') : 'No expiration'}
                  </div>
                  {item.lot_batch_number && (
                    <div className="text-sm text-muted-foreground mt-2">
                      Lot: {item.lot_batch_number}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {item.notes && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-sm font-medium mb-2">Notes</div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Storage Locations Tab */}
          <TabsContent value="locations">
            <Card>
              <CardContent className="pt-6">
                {locationStock && locationStock.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {locationStock.map((stock: any) => (
                        <TableRow key={stock.id}>
                          <TableCell className="font-medium">
                            {stock.location_name || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {stock.location_description || '—'}
                          </TableCell>
                          <TableCell className="text-right font-medium">{stock.quantity}</TableCell>
                          <TableCell className="text-right text-sm text-muted-foreground">
                            {format(new Date(stock.updated_at), 'MMM dd, yyyy')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No storage locations assigned
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assigned Vehicles Tab */}
          <TabsContent value="vehicles">
            <Card>
              <CardContent className="pt-6">
                {assignedVehicles && assignedVehicles.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead className="text-right">Qty Required</TableHead>
                        <TableHead>Last Inspection</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignedVehicles.map((vehicle) => (
                        <TableRow key={vehicle.vehicleId}>
                          <TableCell className="font-medium">
                            <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold">
                              {vehicle.licensePlate}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {vehicle.make} {vehicle.model}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {vehicle.quantityRequired}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {vehicle.lastUpdated 
                              ? format(new Date(vehicle.lastUpdated), 'MMM dd, yyyy')
                              : 'Never'
                            }
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onClose();
                                navigate('/fleet');
                                // TODO: Open vehicle detail drawer
                              }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No vehicles assigned this item
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Supplier Tab */}
          <TabsContent value="supplier">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Supplier Name</div>
                    <div className="font-medium">{item.supplier_name || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Contact</div>
                    <div className="font-medium">{item.supplier_contact || 'Not specified'}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">SKU</div>
                    <div className="font-medium">{item.supplier_sku || 'Not specified'}</div>
                  </div>
                  {item.supplier_portal_url && (
                    <div>
                      <div className="text-sm text-muted-foreground mb-1">Portal URL</div>
                      <a 
                        href={item.supplier_portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1"
                      >
                        {item.supplier_portal_url}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Tab */}
          <TabsContent value="usage">
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Total Uses</div>
                    <div className="text-3xl font-bold">{item.usage_count || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Last Used</div>
                    <div className="text-xl font-medium">
                      {item.last_usage_date 
                        ? format(new Date(item.last_usage_date), 'MMM dd, yyyy')
                        : 'Never used'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
