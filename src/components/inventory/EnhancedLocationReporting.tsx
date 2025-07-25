import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { StorageLocationSelector } from '@/components/inventory/StorageLocationSelector';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { BarChart3, Download, Filter, TrendingUp, Package, Building } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { addDays, format } from 'date-fns';

interface LocationStockData {
  location_name: string;
  total_items: number;
  total_value: number;
  low_stock_items: number;
  categories: Record<string, number>;
}

interface StockMovementData {
  date: string;
  transfers_in: number;
  transfers_out: number;
  adjustments: number;
  location_name: string;
}

export const EnhancedLocationReporting: React.FC = () => {
  const [selectedLocationId, setSelectedLocationId] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });
  const [reportType, setReportType] = useState('overview');

  // Stock by Location Overview
  const { data: locationStockData, isLoading: stockLoading } = useQuery({
    queryKey: ['location-stock-overview', selectedLocationId],
    queryFn: async () => {
      const { data: locations, error: locError } = await supabase
        .from('storage_locations')
        .select('id, name')
        .eq('is_active', true);

      if (locError) throw locError;

      const locationData: LocationStockData[] = [];

      for (const location of locations) {
        if (selectedLocationId !== 'all' && location.id !== selectedLocationId) continue;

        const { data: stockData, error: stockError } = await supabase
          .from('consumable_location_stock')
          .select(`
            quantity,
            consumables(
              name,
              category,
              unit_cost,
              reorder_threshold
            )
          `)
          .eq('storage_location_id', location.id);

        if (stockError) throw stockError;

        const totalItems = stockData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const totalValue = stockData?.reduce((sum, item) => 
          sum + (item.quantity * (item.consumables?.unit_cost || 0)), 0) || 0;
        const lowStockItems = stockData?.filter(item => 
          item.quantity <= (item.consumables?.reorder_threshold || 5)).length || 0;

        const categories: Record<string, number> = {};
        stockData?.forEach(item => {
          const category = item.consumables?.category || 'Uncategorized';
          categories[category] = (categories[category] || 0) + item.quantity;
        });

        locationData.push({
          location_name: location.name,
          total_items: totalItems,
          total_value: totalValue,
          low_stock_items: lowStockItems,
          categories
        });
      }

      return locationData;
    }
  });

  // Stock Movement Analytics
  const { data: movementData, isLoading: movementLoading } = useQuery({
    queryKey: ['stock-movements', selectedLocationId, dateRange],
    queryFn: async () => {
      if (!dateRange?.from || !dateRange?.to) return [];

      const { data: adjustments, error } = await supabase
        .from('consumable_stock_adjustments')
        .select(`
          created_at,
          adjustment_type,
          quantity_change,
          consumables(
            consumable_location_stock(
              storage_location_id,
              storage_locations(name)
            )
          )
        `)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Process data by date and location
      const dailyData: Record<string, StockMovementData> = {};

      adjustments?.forEach(adj => {
        const date = format(new Date(adj.created_at), 'yyyy-MM-dd');
        const locationName = 'All Locations'; // Simplified for now
        
        const key = `${date}-${locationName}`;
        if (!dailyData[key]) {
          dailyData[key] = {
            date,
            transfers_in: 0,
            transfers_out: 0,
            adjustments: 0,
            location_name: locationName
          };
        }

        switch (adj.adjustment_type) {
          case 'transfer_in':
            dailyData[key].transfers_in += Math.abs(adj.quantity_change);
            break;
          case 'transfer_out':
            dailyData[key].transfers_out += Math.abs(adj.quantity_change);
            break;
          default:
            dailyData[key].adjustments += Math.abs(adj.quantity_change);
        }
      });

      return Object.values(dailyData);
    },
    enabled: !!(dateRange?.from && dateRange?.to)
  });

  // Category distribution data for pie chart
  const categoryData = React.useMemo(() => {
    if (!locationStockData) return [];
    
    const allCategories: Record<string, number> = {};
    locationStockData.forEach(location => {
      Object.entries(location.categories).forEach(([category, count]) => {
        allCategories[category] = (allCategories[category] || 0) + count;
      });
    });

    return Object.entries(allCategories).map(([name, value]) => ({ name, value }));
  }, [locationStockData]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316'];

  const exportReport = () => {
    // This would generate and download a CSV/PDF report
    const reportData = {
      location_overview: locationStockData,
      movements: movementData,
      date_range: dateRange,
      generated_at: new Date().toISOString()
    };
    
    console.log('Exporting report:', reportData);
    // Implementation would use a library like jsPDF or generate CSV
  };

  const isLoading = stockLoading || movementLoading;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Enhanced Location Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <StorageLocationSelector
              value={selectedLocationId}
              onValueChange={setSelectedLocationId}
              includeAllSites={true}
              placeholder="Filter by location"
            />
            
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger>
                <SelectValue placeholder="Report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Stock Overview</SelectItem>
                <SelectItem value="movements">Stock Movements</SelectItem>
                <SelectItem value="categories">Category Analysis</SelectItem>
              </SelectContent>
            </Select>

            <DatePickerWithRange
              date={dateRange}
              onDateChange={setDateRange}
              className="w-full"
            />

            <Button onClick={exportReport} className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading analytics data...
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              {reportType === 'overview' && locationStockData && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {locationStockData.map((location) => (
                      <Card key={location.location_name}>
                        <CardHeader className="pb-3">
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Building className="w-4 h-4" />
                            {location.location_name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Items:</span>
                            <Badge variant="outline">{location.total_items}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Total Value:</span>
                            <Badge variant="outline">${location.total_value.toFixed(2)}</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Low Stock Items:</span>
                            <Badge variant={location.low_stock_items > 0 ? "destructive" : "secondary"}>
                              {location.low_stock_items}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Stock Distribution Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stock Distribution by Location</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={locationStockData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="location_name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="total_items" fill="#3B82F6" name="Total Items" />
                          <Bar dataKey="low_stock_items" fill="#EF4444" name="Low Stock Items" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </>
              )}

              {/* Movement Analytics */}
              {reportType === 'movements' && movementData && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stock Movement Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={movementData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="transfers_in" fill="#10B981" name="Transfers In" />
                        <Bar dataKey="transfers_out" fill="#F59E0B" name="Transfers Out" />
                        <Bar dataKey="adjustments" fill="#8B5CF6" name="Other Adjustments" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* Category Analysis */}
              {reportType === 'categories' && categoryData.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inventory by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};