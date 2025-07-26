import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

interface StockTransfer {
  id: string;
  consumable_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  reason: string;
  created_at: string;
  consumables: {
    name: string;
    category: string;
  };
  from_location: {
    name: string;
  };
  to_location: {
    name: string;
  };
}

export const StockTransferReporting: React.FC = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedConsumable, setSelectedConsumable] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Calculate date range
  const getDateRange = () => {
    const end = new Date();
    let start = new Date();
    
    switch (dateRange) {
      case '7d':
        start.setDate(end.getDate() - 7);
        break;
      case '30d':
        start.setDate(end.getDate() - 30);
        break;
      case '90d':
        start.setDate(end.getDate() - 90);
        break;
      case 'custom':
        if (startDate && endDate) {
          start = new Date(startDate);
          end.setTime(new Date(endDate).getTime());
        }
        break;
    }
    
    return { start: start.toISOString(), end: end.toISOString() };
  };

  // Fetch stock transfers
  const { data: stockTransfers = [] } = useQuery({
    queryKey: ['stock-transfers', dateRange, selectedLocation, selectedConsumable, startDate, endDate],
    queryFn: async () => {
      const { start, end } = getDateRange();
      
      let query = supabase
        .from('consumable_stock_adjustments')
        .select(`
          *,
          consumables!inner(name, category)
        `)
        .gte('created_at', start)
        .lte('created_at', end)
        .eq('adjustment_type', 'transfer')
        .order('created_at', { ascending: false });

      if (selectedConsumable !== 'all') {
        query = query.eq('consumable_id', selectedConsumable);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch storage locations
  const { data: storageLocations = [] } = useQuery({
    queryKey: ['storage-locations-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch consumables
  const { data: consumables = [] } = useQuery({
    queryKey: ['consumables-transfers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables')
        .select('id, name, category')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate metrics
  const totalTransfers = stockTransfers.length;
  const totalQuantityMoved = stockTransfers.reduce((sum, transfer) => sum + Math.abs(transfer.quantity_change), 0);
  const mostActiveConsumable = consumables.find(c => 
    c.id === stockTransfers
      .reduce((acc, transfer) => {
        acc[transfer.consumable_id] = (acc[transfer.consumable_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
      .toString()
  );

  const exportReport = () => {
    // Mock export functionality
    console.log('Exporting stock transfer report...');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransfers}</div>
            <p className="text-xs text-muted-foreground">
              Stock movements tracked
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quantity Moved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuantityMoved}</div>
            <p className="text-xs text-muted-foreground">
              Total units transferred
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{storageLocations.length}</div>
            <p className="text-xs text-muted-foreground">
              Storage sites involved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Items Transferred</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(stockTransfers.map(t => t.consumable_id)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Unique consumables moved
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Report Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {dateRange === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Storage Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {storageLocations.map(location => (
                    <SelectItem key={location.id} value={location.id}>{location.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Consumable</Label>
              <Select value={selectedConsumable} onValueChange={setSelectedConsumable}>
                <SelectTrigger>
                  <SelectValue placeholder="All consumables" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Consumables</SelectItem>
                  {consumables.map(consumable => (
                    <SelectItem key={consumable.id} value={consumable.id}>{consumable.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={exportReport} variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Stock Transfer History</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Consumable</TableHead>
                      <TableHead>Transfer</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockTransfers.map((transfer) => (
                      <TableRow key={transfer.id}>
                        <TableCell>
                          {format(new Date(transfer.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transfer.consumables.name}</div>
                            <Badge variant="outline" className="text-xs">
                              {transfer.consumables.category}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm">
                            <span>Location Transfer</span>
                            <ArrowRight className="h-3 w-3" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transfer.quantity_change > 0 ? "default" : "destructive"}
                            className={transfer.quantity_change > 0 ? "bg-green-100 text-green-800" : ""}
                          >
                            {transfer.quantity_change > 0 ? '+' : ''}{transfer.quantity_change}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {transfer.reason || 'No reason provided'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};