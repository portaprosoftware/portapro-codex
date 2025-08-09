import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export const RouteStockCheck: React.FC = () => {
  const [vehicleId, setVehicleId] = useState<string>('');
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
    queryKey: ['route-stock-status', vehicleId, serviceDate],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_route_stock_status', {
        vehicle_uuid: vehicleId,
        service_date: serviceDate,
      });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!vehicleId && !!serviceDate,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Route vs Truck Stock</CardTitle>
        {/* SEO: canonical and h1 in parent page; this is a sub-card */}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Vehicle</label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger>
                <SelectValue placeholder="Select vehicle" />
              </SelectTrigger>
              <SelectContent>
                {vehicles?.map((v: any) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.license_plate || v.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-muted-foreground">Service Date</label>
            <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
          </div>
        </div>

        {!vehicleId ? (
          <div className="text-sm text-muted-foreground">Pick a vehicle and date to check stock readiness.</div>
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
