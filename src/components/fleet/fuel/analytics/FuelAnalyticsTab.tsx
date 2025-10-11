import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  useVendorPerformance, 
  useCostPerMile, 
  useFleetMPG, 
  useSourceComparison 
} from '@/hooks/useFuelAnalytics';
import { UnifiedFuelFilters, useUnifiedFuelConsumption } from '@/hooks/useUnifiedFuelConsumption';
import { exportUnifiedFuelToCSV, formatDateRange } from '@/utils/fuelExport';
import { ComplianceAlerts } from './ComplianceAlerts';
import { FuelReportsTab } from '../FuelReportsTab';
import { 
  DollarSign, 
  TrendingUp, 
  Fuel, 
  Download, 
  BarChart3,
  Award,
  Gauge,
  Container,
  TruckIcon
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FuelExportModal } from './FuelExportModal';
import {
  exportVendorPerformanceToCSV,
  exportCostPerMileToCSV,
  exportFleetMPGToCSV,
  exportSourceComparisonToCSV,
  exportAnalyticsSummaryToCSV
} from '@/utils/fuelExport';
import {
  exportVendorPerformanceToPDF,
  exportCostPerMileToPDF,
  exportFleetMPGToPDF,
  exportSourceComparisonToPDF,
  exportAnalyticsSummaryToPDF,
  exportTransactionsToPDF
} from '@/utils/fuelPDFExport';

interface FuelAnalyticsTabProps {
  filters?: UnifiedFuelFilters;
}

export const FuelAnalyticsTab: React.FC<FuelAnalyticsTabProps> = ({ filters }) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [showExportModal, setShowExportModal] = useState(false);

  const { data: vendorPerformance, isLoading: vendorLoading } = useVendorPerformance(filters);
  const { data: costPerMile, isLoading: costLoading } = useCostPerMile(filters);
  const { data: fleetMPG, isLoading: mpgLoading } = useFleetMPG(filters);
  const { data: sourceComparison, isLoading: sourceLoading } = useSourceComparison(filters);
  const { data: unifiedData } = useUnifiedFuelConsumption(filters);

  const handleExport = (format: 'csv' | 'pdf', dataType: string) => {
    const dateRangeStr = formatDateRange(filters?.dateFrom, filters?.dateTo);
    
    try {
      if (format === 'csv') {
        switch (dataType) {
          case 'transactions':
            if (!unifiedData || unifiedData.length === 0) {
              toast({ title: "No data", description: "No fuel transactions to export", variant: "destructive" });
              return;
            }
            exportUnifiedFuelToCSV(unifiedData, `fuel-transactions_${dateRangeStr}.csv`);
            break;
          
          case 'summary':
            exportAnalyticsSummaryToCSV({
              costPerMile: costPerMile?.cost_per_mile || 0,
              totalMiles: costPerMile?.total_miles_driven || 0,
              fleetMPG: fleetMPG?.fleet_avg_mpg || 0,
              totalGallons: fleetMPG?.total_gallons || 0,
              totalCost: sourceComparison?.reduce((sum, s) => sum + s.total_cost, 0) || 0,
              sourceCount: sourceComparison?.length || 0
            }, `analytics-summary_${dateRangeStr}.csv`);
            break;
          
          case 'sources':
            if (!sourceComparison || sourceComparison.length === 0) {
              toast({ title: "No data", description: "No source comparison data to export", variant: "destructive" });
              return;
            }
            exportSourceComparisonToCSV(sourceComparison, `source-comparison_${dateRangeStr}.csv`);
            break;
          
          case 'vendors':
            if (!vendorPerformance || vendorPerformance.length === 0) {
              toast({ title: "No data", description: "No vendor data to export", variant: "destructive" });
              return;
            }
            exportVendorPerformanceToCSV(vendorPerformance, `vendor-performance_${dateRangeStr}.csv`);
            break;
          
          case 'cost-per-mile':
            if (!costPerMile || costPerMile.by_vehicle.length === 0) {
              toast({ title: "No data", description: "No cost per mile data to export", variant: "destructive" });
              return;
            }
            exportCostPerMileToCSV(costPerMile, `cost-per-mile_${dateRangeStr}.csv`);
            break;
          
          case 'fleet-mpg':
            if (!fleetMPG || fleetMPG.by_vehicle.length === 0) {
              toast({ title: "No data", description: "No MPG data to export", variant: "destructive" });
              return;
            }
            exportFleetMPGToCSV(fleetMPG, `fleet-mpg_${dateRangeStr}.csv`);
            break;
        }
      } else if (format === 'pdf') {
        const pdfOptions = {
          title: '',
          subtitle: '',
          dateRange: filters?.dateFrom || filters?.dateTo 
            ? `Period: ${filters?.dateFrom?.toLocaleDateString() || 'Start'} - ${filters?.dateTo?.toLocaleDateString() || 'End'}`
            : 'All Time',
          companyName: 'PortaPro'
        };

        switch (dataType) {
          case 'transactions':
            if (!unifiedData || unifiedData.length === 0) {
              toast({ title: "No data", description: "No fuel transactions to export", variant: "destructive" });
              return;
            }
            exportTransactionsToPDF(unifiedData, pdfOptions);
            break;
          
          case 'summary':
            exportAnalyticsSummaryToPDF({
              costPerMile: costPerMile?.cost_per_mile || 0,
              totalMiles: costPerMile?.total_miles_driven || 0,
              fleetMPG: fleetMPG?.fleet_avg_mpg || 0,
              totalGallons: fleetMPG?.total_gallons || 0,
              totalCost: sourceComparison?.reduce((sum, s) => sum + s.total_cost, 0) || 0,
              sourceCount: sourceComparison?.length || 0
            }, pdfOptions);
            break;
          
          case 'sources':
            if (!sourceComparison || sourceComparison.length === 0) {
              toast({ title: "No data", description: "No source comparison data to export", variant: "destructive" });
              return;
            }
            exportSourceComparisonToPDF(sourceComparison, pdfOptions);
            break;
          
          case 'vendors':
            if (!vendorPerformance || vendorPerformance.length === 0) {
              toast({ title: "No data", description: "No vendor data to export", variant: "destructive" });
              return;
            }
            exportVendorPerformanceToPDF(vendorPerformance, pdfOptions);
            break;
          
          case 'cost-per-mile':
            if (!costPerMile || costPerMile.by_vehicle.length === 0) {
              toast({ title: "No data", description: "No cost per mile data to export", variant: "destructive" });
              return;
            }
            exportCostPerMileToPDF(costPerMile, pdfOptions);
            break;
          
          case 'fleet-mpg':
            if (!fleetMPG || fleetMPG.by_vehicle.length === 0) {
              toast({ title: "No data", description: "No MPG data to export", variant: "destructive" });
              return;
            }
            exportFleetMPGToPDF(fleetMPG, pdfOptions);
            break;
        }
      }

      toast({
        title: "Export successful",
        description: `Downloaded ${format.toUpperCase()} file successfully`
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "An error occurred while exporting the data",
        variant: "destructive"
      });
    }
  };

  const getSourceBadge = (sourceType: string) => {
    switch (sourceType) {
      case 'retail':
      case 'retail_station':
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold"><Fuel className="h-3 w-3 mr-1" />Retail</Badge>;
      case 'yard_tank':
        return <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold"><Container className="h-3 w-3 mr-1" />Yard Tank</Badge>;
      case 'mobile_service':
        return <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold"><TruckIcon className="h-3 w-3 mr-1" />Mobile Service</Badge>;
      default:
        return <Badge variant="outline">{sourceType}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Export */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Fuel Analytics & Reports</h2>
          <p className="text-muted-foreground">Advanced metrics and compliance tracking</p>
        </div>
        <Button onClick={() => setShowExportModal(true)} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost Per Mile</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {costLoading ? (
                  <div className="text-2xl font-bold">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${costPerMile?.cost_per_mile.toFixed(3) || '0.000'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {costPerMile?.total_miles_driven.toLocaleString() || 0} miles driven
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fleet Avg MPG</CardTitle>
                <Gauge className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {mpgLoading ? (
                  <div className="text-2xl font-bold">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      {fleetMPG?.fleet_avg_mpg.toFixed(1) || '0.0'} MPG
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fleetMPG?.total_gallons.toFixed(0) || 0} gallons consumed
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Fuel Cost</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {sourceLoading ? (
                  <div className="text-2xl font-bold">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">
                      ${(sourceComparison?.reduce((sum, source) => sum + source.total_cost, 0) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <p className="text-xs text-muted-foreground">All sources combined</p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fuel Sources</CardTitle>
                <Fuel className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                {sourceLoading ? (
                  <div className="text-2xl font-bold">Loading...</div>
                ) : (
                  <>
                    <div className="text-2xl font-bold">{sourceComparison?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">Active fuel sources</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Source Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5" />
                Fuel Source Cost Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sourceLoading ? (
                <div>Loading source comparison...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Type</TableHead>
                      <TableHead className="text-right">Gallons</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Avg $/Gal</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                     {sourceComparison?.map((source) => (
                      <TableRow key={source.source_type}>
                        <TableCell>
                          {getSourceBadge(source.source_type)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {source.total_gallons.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${source.total_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${source.avg_cost_per_gallon.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right">
                          {source.transaction_count}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Vendor Performance Rankings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5" />
                Vendor Performance Rankings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {vendorLoading ? (
                <div>Loading vendor data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Vendor/Source</TableHead>
                      <TableHead className="text-right">Gallons</TableHead>
                      <TableHead className="text-right">Total Spent</TableHead>
                      <TableHead className="text-right">Avg Price</TableHead>
                      <TableHead className="text-right">Purchases</TableHead>
                      <TableHead>Last Purchase</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorPerformance?.map((vendor, idx) => (
                      <TableRow key={vendor.vendor_name}>
                        <TableCell className="font-medium">#{idx + 1}</TableCell>
                        <TableCell>{vendor.vendor_name}</TableCell>
                        <TableCell className="text-right">
                          {vendor.total_gallons.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${vendor.total_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ${vendor.avg_cost_per_gallon.toFixed(3)}
                        </TableCell>
                        <TableCell className="text-right">
                          {vendor.transaction_count}
                        </TableCell>
                        <TableCell>{new Date(vendor.last_purchase_date).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Cost Per Mile by Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cost Per Mile by Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              {costLoading ? (
                <div>Loading vehicle data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Miles Driven</TableHead>
                      <TableHead className="text-right">Fuel Cost</TableHead>
                      <TableHead className="text-right">$/Mile</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costPerMile?.by_vehicle.map((vehicle) => (
                      <TableRow key={vehicle.vehicle_id}>
                        <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                        <TableCell className="text-right">
                          {vehicle.miles_driven.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          ${vehicle.fuel_cost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ${vehicle.cost_per_mile.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Fleet MPG by Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fleet MPG by Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              {mpgLoading ? (
                <div>Loading MPG data...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead className="text-right">Miles</TableHead>
                      <TableHead className="text-right">Gallons</TableHead>
                      <TableHead className="text-right">MPG</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fleetMPG?.by_vehicle.map((vehicle) => (
                      <TableRow key={vehicle.vehicle_id}>
                        <TableCell className="font-medium">{vehicle.license_plate}</TableCell>
                        <TableCell className="text-right">
                          {vehicle.miles.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {vehicle.gallons.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {vehicle.mpg.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <ComplianceAlerts />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <FuelReportsTab />
        </TabsContent>
      </Tabs>

      <FuelExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        activeTab={activeTab}
        onExport={handleExport}
        dataCount={{
          transactions: unifiedData?.length || 0,
          vendors: vendorPerformance?.length || 0,
          vehicles: costPerMile?.by_vehicle.length || 0,
          sources: sourceComparison?.length || 0,
          alerts: 0 // Will be implemented when compliance alerts are available
        }}
      />
    </div>
  );
};
