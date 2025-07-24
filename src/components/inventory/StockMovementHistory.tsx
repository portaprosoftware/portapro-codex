import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, TrendingUp, TrendingDown, Package, RotateCcw } from 'lucide-react';

export const StockMovementHistory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('30');
  const [selectedConsumable, setSelectedConsumable] = useState('all');

  const { data: stockMovements, isLoading } = useQuery({
    queryKey: ['stock-movements', filterType, dateRange, selectedConsumable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumable_stock_adjustments' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const { data: consumables } = useQuery({
    queryKey: ['consumables-for-movement'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return (data || []) as any[];
    }
  });

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'received':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'adjustment':
        return <Package className="w-4 h-4 text-blue-600" />;
      case 'transfer':
        return <RotateCcw className="w-4 h-4 text-purple-600" />;
      case 'count_adjustment':
        return <TrendingDown className="w-4 h-4 text-orange-600" />;
      default:
        return <Package className="w-4 h-4 text-gray-600" />;
    }
  };

  const getMovementBadge = (type: string, quantityChange: number) => {
    if (type === 'transfer') {
      return <Badge variant="secondary">Transfer</Badge>;
    }
    
    if (quantityChange > 0) {
      return <Badge variant="default">+{quantityChange}</Badge>;
    } else if (quantityChange < 0) {
      return <Badge variant="destructive">{quantityChange}</Badge>;
    } else {
      return <Badge variant="secondary">No Change</Badge>;
    }
  };

  const filteredMovements = stockMovements?.filter((movement: any) => {
    const matchesSearch = movement.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || movement.adjustment_type === filterType;
    const matchesConsumable = selectedConsumable === 'all' || movement.consumable_id === selectedConsumable;
    
    return matchesSearch && matchesType && matchesConsumable;
  }) || [];

  const exportHistory = (format: 'pdf' | 'excel') => {
    console.log(`Exporting stock movement history as ${format}`);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Movement Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search movements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Movement Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="count_adjustment">Count Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Consumable</Label>
              <Select value={selectedConsumable} onValueChange={setSelectedConsumable}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Items</SelectItem>
                  {(consumables as any)?.map((consumable: any) => (
                    <SelectItem key={consumable.id} value={consumable.id}>
                      {consumable.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => exportHistory('pdf')}>
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => exportHistory('excel')}>
                  <Download className="w-4 h-4 mr-2" />
                  Excel
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Movements</p>
                <p className="text-2xl font-bold">{filteredMovements.length}</p>
              </div>
              <Package className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Positive Changes</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredMovements.filter((m: any) => m.quantity_change > 0).length}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Negative Changes</p>
                <p className="text-2xl font-bold text-red-600">
                  {filteredMovements.filter((m: any) => m.quantity_change < 0).length}
                </p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Transfers</p>
                <p className="text-2xl font-bold text-purple-600">
                  {filteredMovements.filter((m: any) => m.adjustment_type === 'transfer').length}
                </p>
              </div>
              <RotateCcw className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Movement History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading movement history...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Consumable</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Before</TableHead>
                  <TableHead>After</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovements.map((movement: any) => (
                  <TableRow key={movement.id}>
                    <TableCell>
                      {new Date(movement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMovementIcon(movement.adjustment_type)}
                        <span className="capitalize">{movement.adjustment_type?.replace('_', ' ')}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {consumables?.find((c: any) => c.id === movement.consumable_id)?.name || 'Unknown'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getMovementBadge(movement.adjustment_type, movement.quantity_change)}
                    </TableCell>
                    <TableCell>{movement.previous_quantity}</TableCell>
                    <TableCell>{movement.new_quantity}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {movement.reason}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {movement.notes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};