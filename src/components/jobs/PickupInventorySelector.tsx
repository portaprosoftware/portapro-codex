import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Package, MapPin, Calendar, AlertTriangle } from 'lucide-react';
import type { JobItemSelection } from '@/contexts/JobWizardContext';

interface EquipmentAtLocation {
  assignment_id: string;
  product_id: string;
  product_item_id?: string;
  product_name: string;
  item_code?: string;
  delivery_date: string;
  status: string;
  quantity: number;
  location_name?: string;
  job_id: string;
  job_number?: string;
}

interface PickupInventorySelectorProps {
  customerId: string;
  value?: JobItemSelection[];
  onChange?: (items: JobItemSelection[]) => void;
}

export const PickupInventorySelector: React.FC<PickupInventorySelectorProps> = ({
  customerId,
  value = [],
  onChange,
}) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch equipment currently at customer location
  const { data: equipmentAtLocation = [], isLoading, error } = useQuery<EquipmentAtLocation[]>({
    queryKey: ['customer-equipment', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      
      const { data, error } = await supabase
        .from('equipment_assignments')
        .select(`
          id,
          product_id,
          product_item_id,
          quantity,
          assigned_date,
          status,
          job_id,
          products!inner (
            id,
            name
          ),
          product_items (
            id,
            item_code
          ),
          jobs!inner (
            id,
            job_number,
            customer_id,
            customer_service_locations (
              location_name
            )
          )
        `)
        .eq('jobs.customer_id', customerId)
        .in('status', ['delivered', 'in_service'])
        .order('assigned_date', { ascending: false });

      if (error) throw error;

      return (data || []).map((assignment: any) => ({
        assignment_id: assignment.id,
        product_id: assignment.product_id,
        product_item_id: assignment.product_item_id,
        product_name: assignment.products?.name || 'Unknown Product',
        item_code: assignment.product_items?.item_code,
        delivery_date: assignment.assigned_date,
        status: assignment.status,
        quantity: assignment.quantity || 1,
        location_name: assignment.jobs?.customer_service_locations?.location_name,
        job_id: assignment.job_id,
        job_number: assignment.jobs?.job_number
      }));
    },
    enabled: !!customerId,
  });

  const handleItemToggle = (equipment: EquipmentAtLocation, checked: boolean) => {
    const newSelectedItems = new Set(selectedItems);
    
    if (checked) {
      newSelectedItems.add(equipment.assignment_id);
    } else {
      newSelectedItems.delete(equipment.assignment_id);
    }
    
    setSelectedItems(newSelectedItems);

    // Update the parent with selected items
    const newItems: JobItemSelection[] = [];
    
    equipmentAtLocation.forEach(eq => {
      if (newSelectedItems.has(eq.assignment_id)) {
        newItems.push({
          product_id: eq.product_id,
          quantity: eq.quantity,
          strategy: eq.product_item_id ? 'specific' : 'bulk',
          specific_item_ids: eq.product_item_id ? [eq.product_item_id] : undefined,
        });
      }
    });

    onChange?.(newItems);
  };

  const handleSelectAll = () => {
    const allIds = new Set(equipmentAtLocation.map(eq => eq.assignment_id));
    setSelectedItems(allIds);
    
    const allItems: JobItemSelection[] = equipmentAtLocation.map(eq => ({
      product_id: eq.product_id,
      quantity: eq.quantity,
      strategy: eq.product_item_id ? 'specific' : 'bulk',
      specific_item_ids: eq.product_item_id ? [eq.product_item_id] : undefined,
    }));
    
    onChange?.(allItems);
  };

  const handleClearAll = () => {
    setSelectedItems(new Set());
    onChange?.([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading equipment at customer location...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-destructive flex items-center justify-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Error loading equipment data
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Equipment Available for Pickup
          </CardTitle>
          <CardDescription>
            Select equipment currently at the customer location to include in this pickup job.
            Only delivered equipment that hasn't been picked up yet is shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {equipmentAtLocation.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No Equipment Found
              </h3>
              <p className="text-sm text-muted-foreground">
                No equipment is currently at this customer location for pickup.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Bulk Actions */}
              <div className="flex justify-between items-center pb-4 border-b">
                <p className="text-sm text-muted-foreground">
                  {equipmentAtLocation.length} item{equipmentAtLocation.length !== 1 ? 's' : ''} available
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleClearAll}>
                    Clear All
                  </Button>
                </div>
              </div>

              {/* Equipment List */}
              <div className="space-y-3">
                {equipmentAtLocation.map((equipment) => (
                  <Card key={equipment.assignment_id} className="relative">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={equipment.assignment_id}
                          checked={selectedItems.has(equipment.assignment_id)}
                          onCheckedChange={(checked) => 
                            handleItemToggle(equipment, checked as boolean)
                          }
                          className="mt-1"
                        />
                        
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-foreground">
                              {equipment.product_name}
                            </h4>
                            <Badge variant={equipment.status === 'delivered' ? 'default' : 'secondary'}>
                              {equipment.status}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Package className="w-4 h-4" />
                              {equipment.item_code ? (
                                <span>Unit: {equipment.item_code}</span>
                              ) : (
                                <span>Qty: {equipment.quantity}</span>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Delivered: {new Date(equipment.delivery_date).toLocaleDateString()}</span>
                            </div>
                            
                            {equipment.location_name && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                <span>{equipment.location_name}</span>
                              </div>
                            )}
                          </div>
                          
                          {equipment.job_number && (
                            <div className="text-xs text-muted-foreground">
                              From Job: {equipment.job_number}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};