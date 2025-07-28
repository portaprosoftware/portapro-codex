import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsumableLocationBreakdownProps {
  consumableId: string;
  totalOnHand: number;
}

interface LocationStockData {
  id: string;
  quantity: number;
  storage_location: {
    id: string;
    name: string;
  };
  consumable: {
    reorder_threshold: number;
  };
}

export const ConsumableLocationBreakdown: React.FC<ConsumableLocationBreakdownProps> = ({
  consumableId,
  totalOnHand
}) => {
  const { data: locationStock = [], isLoading } = useQuery({
    queryKey: ['consumable-location-stock', consumableId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_location_stock')
        .select(`
          id,
          quantity,
          storage_location:storage_locations(id, name),
          consumable:consumables(reorder_threshold)
        `)
        .eq('consumable_id', consumableId)
        .order('quantity', { ascending: false });
      
      if (error) throw error;
      return data as LocationStockData[];
    }
  });

  const getStockStatus = (quantity: number, reorderThreshold: number) => {
    if (quantity === 0) return { status: 'out', color: 'destructive', text: 'Out of Stock' };
    if (quantity <= reorderThreshold) return { status: 'low', color: 'warning', text: 'Low Stock' };
    return { status: 'good', color: 'default', text: 'Good Stock' };
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-blue-600 hover:text-blue-800 p-0 h-auto">
          <MapPin className="h-4 w-4 mr-1" />
          View Breakdown ({locationStock.length} locations)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Stock Breakdown
            <Badge variant="outline" className="ml-auto">
              Total: {totalOnHand}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              Loading location breakdown...
            </div>
          ) : locationStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No stock allocated to any locations
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Storage Location</TableHead>
                    <TableHead className="text-right">On Hand</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locationStock.map((stock, index) => {
                    const status = getStockStatus(
                      stock.quantity, 
                      stock.consumable?.reorder_threshold || 0
                    );
                    
                    return (
                      <TableRow 
                        key={`${stock.id}-${index}`}
                        className={cn(
                          status.status === 'out' && 'bg-red-50',
                          status.status === 'low' && 'bg-amber-50'
                        )}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {stock.storage_location?.name || 'Unknown Location'}
                            {status.status !== 'good' && (
                              <AlertTriangle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={cn(
                            "font-medium",
                            status.status === 'out' && "text-red-600",
                            status.status === 'low' && "text-amber-600"
                          )}>
                            {stock.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={status.color as any}
                            className={cn(
                              status.status === 'low' && "bg-amber-100 text-amber-800 border-amber-200",
                              status.status === 'out' && "bg-red-100 text-red-800 border-red-200"
                            )}
                          >
                            {status.text}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          <div className="flex justify-between items-center pt-4 border-t text-sm">
            <span className="text-gray-600">
              {locationStock.filter(s => s.quantity > 0).length} of {locationStock.length} locations have stock
            </span>
            <span className="font-medium">
              Total Quantity: {totalOnHand}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};