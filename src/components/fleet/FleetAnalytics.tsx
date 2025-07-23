import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy, AlertTriangle, BarChart3, CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface EfficiencyTrend {
  date: string;
  avg_utilization: number;
  total_vehicles: number;
  efficiency_score: number;
}

interface VehicleRanking {
  vehicle_id: string;
  license_plate: string;
  avg_efficiency: number;
  total_loads: number;
  rank: number;
}

interface AnalyticsData {
  period: {
    start_date: string;
    end_date: string;
  };
  daily_trends: EfficiencyTrend[];
  vehicle_rankings: VehicleRanking[];
  generated_at: string;
}

export const FleetAnalytics: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());

  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['fleet-efficiency-trends', startDate, endDate],
    queryFn: async (): Promise<AnalyticsData> => {
      const { data, error } = await supabase.rpc('calculate_fleet_efficiency_trends', {
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd')
      });
      
      if (error) throw error;
      return data as unknown as AnalyticsData;
    }
  });

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    return "outline";
  };

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 80) return "text-green-600";
    if (efficiency >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const totalTrends = analyticsData?.daily_trends || [];
  const avgUtilization = totalTrends.length > 0 
    ? totalTrends.reduce((sum, trend) => sum + trend.avg_utilization, 0) / totalTrends.length 
    : 0;
  const avgEfficiency = totalTrends.length > 0
    ? totalTrends.reduce((sum, trend) => sum + trend.efficiency_score, 0) / totalTrends.length
    : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Date Range Picker */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fleet Analytics</h1>
          <p className="text-muted-foreground">Advanced efficiency and performance insights</p>
        </div>
        
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : "Start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={startDate} onSelect={(date) => date && setStartDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : "End date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar mode="single" selected={endDate} onSelect={(date) => date && setEndDate(date)} initialFocus />
            </PopoverContent>
          </Popover>
          
          <Button onClick={() => refetch()}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Utilization</p>
                <p className="text-2xl font-bold">{avgUtilization.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Efficiency Score</p>
                <p className="text-2xl font-bold">{avgEfficiency.toFixed(1)}</p>
              </div>
              <Trophy className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <p className="text-2xl font-bold">{analyticsData?.vehicle_rankings?.length || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Data Points</p>
                <p className="text-2xl font-bold">{totalTrends.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Daily Trends</TabsTrigger>
          <TabsTrigger value="rankings">Vehicle Rankings</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Efficiency Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {totalTrends.length > 0 ? (
                <div className="space-y-4">
                  {totalTrends.map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{format(new Date(trend.date), 'MMM dd, yyyy')}</p>
                          <p className="text-sm text-muted-foreground">{trend.total_vehicles} vehicles active</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Utilization</p>
                          <p className={cn("font-semibold", getEfficiencyColor(trend.avg_utilization))}>
                            {trend.avg_utilization.toFixed(1)}%
                          </p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Efficiency</p>
                          <p className={cn("font-semibold", getEfficiencyColor(trend.efficiency_score))}>
                            {trend.efficiency_score.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No trend data available for the selected period</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Vehicles</CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData?.vehicle_rankings && analyticsData.vehicle_rankings.length > 0 ? (
                <div className="space-y-4">
                  {analyticsData.vehicle_rankings.map((vehicle) => (
                    <div key={vehicle.vehicle_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Badge variant={getRankBadgeVariant(vehicle.rank)}>
                          #{vehicle.rank}
                        </Badge>
                        <div>
                          <p className="font-medium">{vehicle.license_plate}</p>
                          <p className="text-sm text-muted-foreground">{vehicle.total_loads} loads</p>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Avg Efficiency</p>
                        <p className={cn("text-lg font-semibold", getEfficiencyColor(vehicle.avg_efficiency))}>
                          {vehicle.avg_efficiency.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No vehicle rankings available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};