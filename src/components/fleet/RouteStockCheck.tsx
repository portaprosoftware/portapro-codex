import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

interface RouteStockCheckProps {
  selectedVehicleId?: string;
}

export const RouteStockCheck: React.FC<RouteStockCheckProps> = ({ selectedVehicleId }) => {
  const [serviceDate, setServiceDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const { data: vehicles } = useQuery({
    queryKey: ['vehicles-basic'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles' as any)
        .select('id, license_plate, vehicle_type')
        .order('license_plate');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: routeStatus, isLoading } = useQuery({
    queryKey: ['route-stock-status', selectedVehicleId, serviceDate],
    queryFn: async () => {
      if (!selectedVehicleId || !serviceDate) return [];
      const { data, error } = await supabase.rpc('get_route_stock_status', {
        vehicle_uuid: selectedVehicleId,
        service_date: serviceDate,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!selectedVehicleId && !!serviceDate,
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: false, // Don't refetch on window focus
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Route vs Truck Stock</CardTitle>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1 hover:bg-muted rounded-full transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="max-w-xs p-4" side="bottom" align="start">
                <div className="space-y-2">
                  <h4 className="font-medium">How This Works</h4>
                  <p className="text-sm text-muted-foreground">
                    This tool helps you ensure your truck has enough supplies before starting your route.
                  </p>
                  <div className="space-y-1 text-xs">
                    <p><strong>Needed:</strong> Total supplies required for all jobs assigned to this truck</p>
                    <p><strong>On Truck:</strong> Current stock levels loaded on the vehicle</p>
                    <p><strong>Deficit:</strong> How many more items you need to load</p>
                    <p><strong>Status:</strong> "OK" means you're ready, "Replenish" means load more supplies</p>
                  </div>
                  <div className="pt-2 mt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground italic">
                      Note: This feature requires you to assign vehicles to jobs for each day.
                    </p>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        {/* SEO: canonical and h1 in parent page; this is a sub-card */}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Service Date</label>
            <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
          </div>
        </div>

        {!selectedVehicleId ? (
          <div className="text-sm text-muted-foreground">Select a vehicle above to check stock readiness.</div>
        ) : isLoading ? (
          <div className="text-sm text-muted-foreground">Checking stock...</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Needed</TableHead>
                <TableHead>On Truck</TableHead>
                <TableHead>Deficit</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(routeStatus || []).map((row: any) => (
                <TableRow key={row.consumable_id}>
                  <TableCell className="font-medium">{row.consumable_name}</TableCell>
                  <TableCell>{row.needed_qty}</TableCell>
                  <TableCell>{row.vehicle_balance}</TableCell>
                  <TableCell>{row.deficit}</TableCell>
                  <TableCell>
                    {row.ok ? (
                      <Badge variant="secondary">OK</Badge>
                    ) : (
                      <Badge variant="destructive">Replenish</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default RouteStockCheck;
