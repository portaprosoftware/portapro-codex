import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Package, Plus, RefreshCw, Trash2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { AssignSpillKitToVehicleModal } from './AssignSpillKitToVehicleModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VehicleSpillKitManagerProps {
  vehicleId: string;
  licensePlate: string;
}

type SpillKitItem = {
  inventory_item_id: string;
  item_name: string;
  quantity_required: number;
  assigned_at: string;
};

type VehicleSpillKit = {
  id: string;
  required_contents: SpillKitItem[];
  last_inspection_date?: string;
  next_inspection_due?: string;
  notes?: string;
};

type InventoryStatus = {
  current_stock: number;
  minimum_threshold: number;
  is_critical: boolean;
  expiration_date?: string;
};

export function VehicleSpillKitManager({ vehicleId, licensePlate }: VehicleSpillKitManagerProps) {
  const queryClient = useQueryClient();
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);

  // Fetch vehicle's spill kit
  const { data: spillKit, isLoading } = useQuery({
    queryKey: ['vehicle-spill-kit', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_spill_kits')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .eq('active', true)
        .maybeSingle();
      
      if (error) throw error;
      if (!data) return null;
      
      return {
        ...data,
        required_contents: (data.required_contents as any) as SpillKitItem[],
      } as VehicleSpillKit;
    },
  });

  // Fetch current stock levels for assigned items
  const { data: inventoryStatus } = useQuery({
    queryKey: ['spill-kit-inventory-status', spillKit?.required_contents],
    queryFn: async () => {
      if (!spillKit?.required_contents || spillKit.required_contents.length === 0) {
        return {};
      }

      const itemIds = spillKit.required_contents.map(item => item.inventory_item_id);
      
      const { data, error } = await supabase
        .from('spill_kit_inventory')
        .select('id, current_stock, minimum_threshold, is_critical, expiration_date')
        .in('id', itemIds);
      
      if (error) throw error;
      
      // Convert to map for easy lookup
      return (data || []).reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {} as Record<string, InventoryStatus>);
    },
    enabled: !!spillKit && spillKit.required_contents.length > 0,
  });

  // Remove spill kit mutation
  const removeMutation = useMutation({
    mutationFn: async () => {
      if (!spillKit) return;
      
      const { error } = await supabase
        .from('vehicle_spill_kits')
        .update({ active: false })
        .eq('id', spillKit.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-spill-kit', vehicleId] });
      toast.success('Spill kit removed from vehicle');
      setRemoveDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to remove spill kit: ${error.message}`);
    },
  });

  const getItemStatus = (item: SpillKitItem) => {
    const status = inventoryStatus?.[item.inventory_item_id];
    
    if (!status) {
      return { 
        badge: <Badge variant="outline">Unknown</Badge>,
        severity: 'unknown' 
      };
    }

    // Check expired
    if (status.expiration_date && new Date(status.expiration_date) < new Date()) {
      return {
        badge: <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold">Expired</Badge>,
        severity: 'critical'
      };
    }

    // Check if missing
    if (status.current_stock === 0) {
      return {
        badge: <Badge className="bg-gradient-to-r from-red-500 to-red-700 text-white font-bold">Missing</Badge>,
        severity: status.is_critical ? 'critical' : 'high'
      };
    }

    // Check if insufficient
    if (status.current_stock < item.quantity_required) {
      return {
        badge: <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">Insufficient</Badge>,
        severity: 'medium'
      };
    }

    // Check if low
    if (status.current_stock <= status.minimum_threshold) {
      return {
        badge: <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold">Low Stock</Badge>,
        severity: 'low'
      };
    }

    // Available
    return {
      badge: <Badge className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold">Available</Badge>,
      severity: 'ok'
    };
  };

  const getOverallStatus = () => {
    if (!spillKit?.required_contents || !inventoryStatus) return 'unknown';
    
    const statuses = spillKit.required_contents.map(item => getItemStatus(item).severity);
    
    if (statuses.includes('critical')) return 'critical';
    if (statuses.includes('high')) return 'high';
    if (statuses.includes('medium')) return 'medium';
    if (statuses.includes('low')) return 'low';
    return 'ok';
  };

  const overallStatus = getOverallStatus();

  if (isLoading) {
    return <div className="text-center py-8">Loading spill kit information...</div>;
  }

  if (!spillKit) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Spill Kit Assigned</h3>
          <p className="text-muted-foreground text-center mb-6 max-w-md">
            This vehicle doesn't have a spill kit assigned yet. Assign inventory items to create a compliance-ready spill kit.
          </p>
          <Button onClick={() => setAssignModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Assign Spill Kit
          </Button>
        </CardContent>

        <AssignSpillKitToVehicleModal
          isOpen={assignModalOpen}
          onClose={() => setAssignModalOpen(false)}
          vehicleId={vehicleId}
          licensePlate={licensePlate}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                overallStatus === 'critical' ? 'bg-red-100' :
                overallStatus === 'high' ? 'bg-orange-100' :
                overallStatus === 'medium' || overallStatus === 'low' ? 'bg-yellow-100' :
                'bg-green-100'
              }`}>
                {overallStatus === 'ok' ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : overallStatus === 'critical' || overallStatus === 'high' ? (
                  <XCircle className="h-6 w-6 text-red-600" />
                ) : (
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                )}
              </div>
              <div>
                <CardTitle>Spill Kit Status</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {spillKit.required_contents.length} items assigned
                  {spillKit.last_inspection_date && (
                    <> • Last inspected {format(new Date(spillKit.last_inspection_date), 'MMM dd, yyyy')}</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setAssignModalOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Update Kit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRemoveDialogOpen(true)}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remove Kit
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Required Qty</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assigned</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {spillKit.required_contents.map((item) => {
                const status = getItemStatus(item);
                const stockInfo = inventoryStatus?.[item.inventory_item_id];
                
                return (
                  <TableRow key={item.inventory_item_id}>
                    <TableCell className="font-medium">
                      {item.item_name}
                      {stockInfo?.is_critical && (
                        <Badge className="ml-2 text-xs bg-gradient-to-r from-red-500 to-red-700 text-white font-bold">
                          Critical
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{item.quantity_required}</TableCell>
                    <TableCell>
                      {stockInfo ? stockInfo.current_stock : '—'}
                    </TableCell>
                    <TableCell>{status.badge}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(item.assigned_at), 'MMM dd, yyyy')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals */}
      <AssignSpillKitToVehicleModal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        vehicleId={vehicleId}
        licensePlate={licensePlate}
      />

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Spill Kit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the spill kit assignment from {licensePlate}. You can always assign a new kit later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeMutation.mutate()}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Kit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
