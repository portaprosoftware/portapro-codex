import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { DateRange } from 'react-day-picker';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, Fuel, Gauge } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface FuelTrendData {
  month: string;
  gallons: number;
  cost: number;
  avg_cost_per_gallon: number;
}

interface VehicleEfficiencyData {
  vehicle_id: string;
  license_plate: string;
  make?: string;
  model?: string;
  nickname?: string;
  vehicle_type?: string;
  total_gallons: number;
  total_miles: number;
  mpg: number;
  total_cost: number;
  cost_per_mile: number;
}

export const FuelReportsTab: React.FC = () => {
  const [reportPeriod, setReportPeriod] = useState('last_30_days');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedReport, setSelectedReport] = useState('fuel_usage');

  // Fetch fuel settings for unit preference
  const { data: fuelSettings } = useQuery({
    queryKey: ['fuel-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_settings')
        .select('fuel_unit')
        .limit(1)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    }
  });

  const fuelUnit = fuelSettings?.fuel_unit || 'gallons';
  const fuelUnitLabel = fuelUnit === 'gallons' ? 'Gallons' : 'Liters';
  const fuelUnitAbbrev = fuelUnit === 'gallons' ? 'gal' : 'L';

  // Calculate date range based on period
  const getDateRange = () => {
    const endDate = new Date();
    let startDate = new Date();

    switch (reportPeriod) {
      case 'last_30_days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case 'last_90_days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case 'last_6_months':
        startDate.setMonth(endDate.getMonth() - 6);
        break;
      case 'last_year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'custom':
        if (dateRange?.from && dateRange?.to) {
          return {
            start: dateRange.from.toISOString().split('T')[0],
            end: dateRange.to.toISOString().split('T')[0]
          };
        }
        startDate.setDate(endDate.getDate() - 30);
        break;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const { start: startDate, end: endDate } = getDateRange();

  // Fetch fuel trends data
  const { data: trendData, isLoading: trendLoading } = useQuery({
    queryKey: ['fuel-trends', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select(`
          log_date,
          gallons_purchased,
          total_cost,
          cost_per_gallon
        `)
        .gte('log_date', startDate)
        .lte('log_date', endDate)
        .order('log_date');

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { gallons: number; cost: number; count: number } } = {};
      
      data.forEach(log => {
        const month = new Date(log.log_date).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'short' 
        });
        
        if (!monthlyData[month]) {
          monthlyData[month] = { gallons: 0, cost: 0, count: 0 };
        }
        
        monthlyData[month].gallons += log.gallons_purchased;
        monthlyData[month].cost += log.total_cost;
        monthlyData[month].count += 1;
      });

      return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        gallons: data.gallons,
        cost: data.cost,
        avg_cost_per_gallon: data.cost / data.gallons || 0
      }));
    }
  });

  // Fetch vehicle efficiency data with vehicle details
  const { data: efficiencyData, isLoading: efficiencyLoading } = useQuery({
    queryKey: ['vehicle-efficiency', startDate, endDate],
    queryFn: async () => {
      const { data: effData, error: effError } = await supabase
        .rpc('get_vehicle_efficiency', {
          start_date: startDate,
          end_date: endDate
        });

      if (effError) throw effError;
      
      // Fetch vehicle details for display
      const vehicleIds = effData?.map((v: any) => v.vehicle_id) || [];
      if (vehicleIds.length === 0) return [];
      
      const { data: vehicles, error: vehError } = await supabase
        .from('vehicles')
        .select('id, license_plate, make, model, nickname, vehicle_type')
        .in('id', vehicleIds);
      
      if (vehError) throw vehError;
      
      // Merge efficiency data with vehicle details
      return effData?.map((eff: any) => {
        const vehicle = vehicles?.find(v => v.id === eff.vehicle_id);
        return {
          ...eff,
          make: vehicle?.make,
          model: vehicle?.model,
          nickname: vehicle?.nickname,
          vehicle_type: vehicle?.vehicle_type
        };
      }) || [];
    }
  });

  // Fuel station analysis
  const { data: stationData, isLoading: stationLoading } = useQuery({
    queryKey: ['station-analysis', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_logs')
        .select('fuel_station, gallons_purchased, total_cost, cost_per_gallon')
        .gte('log_date', startDate)
        .lte('log_date', endDate);

      if (error) throw error;

      // Group by station
      const stationAnalysis: { [key: string]: { gallons: number; cost: number; count: number } } = {};
      
      data.forEach(log => {
        const station = log.fuel_station || 'Unknown';
        
        if (!stationAnalysis[station]) {
          stationAnalysis[station] = { gallons: 0, cost: 0, count: 0 };
        }
        
        stationAnalysis[station].gallons += log.gallons_purchased;
        stationAnalysis[station].cost += log.total_cost;
        stationAnalysis[station].count += 1;
      });

      return Object.entries(stationAnalysis)
        .map(([station, data]) => ({
          station,
          gallons: data.gallons,
          cost: data.cost,
          avg_cost_per_gallon: data.cost / data.gallons || 0,
          fill_ups: data.count
        }))
        .sort((a, b) => b.cost - a.cost);
    }
  });

  const COLORS = ['#3366FF', '#6699FF', '#99CCFF', '#CCE5FF', '#E5F3FF'];

  if (trendLoading || efficiencyLoading || stationLoading) {
    return <LoadingSpinner />;
  }

  const renderSelectedReport = () => {
    const emptyMessage = (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground text-center">
          No data to report for selected time period
        </p>
      </div>
    );

    switch (selectedReport) {
      case 'fuel_usage':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Fuel className="h-5 w-5" />
                Fuel Usage Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {!trendData || trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      No data to report for selected time period
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis label={{ value: fuelUnitLabel, angle: -90, position: 'insideLeft' }} />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'gallons' ? `${value} ${fuelUnitAbbrev}` : `$${Number(value).toFixed(2)}`,
                          name === 'gallons' ? fuelUnitLabel : 'Cost'
                        ]}
                      />
                      <Bar 
                        dataKey="gallons" 
                        fill="#3366FF" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'cost_trends':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5" />
                Cost Trends
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {!trendData || trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground text-center">
                      No data to report for selected time period
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value, name) => [
                          `$${Number(value).toFixed(name === 'avg_cost_per_gallon' ? 3 : 2)}`,
                          name === 'cost' ? 'Total Cost' : 'Avg Cost/Gallon'
                        ]}
                      />
                      <Bar 
                        dataKey="cost" 
                        fill="#22C55E" 
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar 
                        dataKey="avg_cost_per_gallon" 
                        fill="#F59E0B" 
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'vehicle_efficiency':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="h-5 w-5" />
                Vehicle Efficiency Report
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!efficiencyData || efficiencyData.length === 0 ? (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground text-center">
                    No data to report for selected time period
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Total Gallons</TableHead>
                        <TableHead>Total Miles</TableHead>
                        <TableHead>MPG</TableHead>
                        <TableHead>Total Cost</TableHead>
                        <TableHead>Cost/Mile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {efficiencyData?.map((vehicle) => (
                        <TableRow key={vehicle.vehicle_id}>
                          <TableCell>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">
                                {vehicle.make} {vehicle.model}
                                {vehicle.nickname && ` - ${vehicle.nickname}`}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {vehicle.license_plate}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.total_gallons?.toFixed(1)}</TableCell>
                          <TableCell>{vehicle.total_miles?.toLocaleString()}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {vehicle.mpg?.toFixed(1)}
                              {vehicle.mpg > 20 ? (
                                <TrendingUp className="h-4 w-4 text-green-500" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>${vehicle.total_cost?.toFixed(2)}</TableCell>
                          <TableCell>${vehicle.cost_per_mile?.toFixed(3)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'station_performance':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fuel Station Performance</CardTitle>
            </CardHeader>
            <CardContent>
              {!stationData || stationData.length === 0 ? (
                <div className="flex items-center justify-center h-60">
                  <p className="text-muted-foreground text-center">
                    No data to report for selected time period
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={stationData?.slice(0, 5)}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="cost"
                          label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {stationData?.slice(0, 5).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `$${Number(value).toFixed(2)}`,
                            props.payload.station
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Station</TableHead>
                          <TableHead>Fill-ups</TableHead>
                          <TableHead>Avg $/Gal</TableHead>
                          <TableHead>Total Cost</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stationData?.slice(0, 5).map((station, index) => (
                          <TableRow key={station.station}>
                            <TableCell className="font-medium">{station.station}</TableCell>
                            <TableCell>{station.fill_ups}</TableCell>
                            <TableCell>${station.avg_cost_per_gallon?.toFixed(3)}</TableCell>
                            <TableCell>${station.cost?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      default:
        return emptyMessage;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Report Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fuel_usage">Fuel Usage Over Time</SelectItem>
                  <SelectItem value="cost_trends">Cost Trends</SelectItem>
                  <SelectItem value="vehicle_efficiency">Vehicle Efficiency</SelectItem>
                  <SelectItem value="station_performance">Station Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Report Period</label>
              <Select value={reportPeriod} onValueChange={setReportPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                  <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                  <SelectItem value="last_6_months">Last 6 Months</SelectItem>
                  <SelectItem value="last_year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportPeriod === 'custom' && (
              <div>
                <label className="block text-sm font-medium mb-2">Custom Date Range</label>
                <DatePickerWithRange
                  date={dateRange}
                  onDateChange={setDateRange}
                  placeholder="Select date range"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Report Display */}
      {renderSelectedReport()}
    </div>
  );
};
