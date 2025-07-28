import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Building, Package, DollarSign } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface LocationReportData {
  summary: {
    total_locations: number;
    total_consumable_types: number;
    total_stock_value: number;
  };
  location_details: Array<{
    location_id: string;
    location_name: string;
    description?: string;
    is_default: boolean;
    consumable_types: number;
    total_units: number;
    total_value: number;
  }>;
}

export function StorageLocationReporting() {
  const [isExporting, setIsExporting] = useState(false);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['storage-location-reporting'],
    queryFn: async (): Promise<LocationReportData> => {
      // Get all storage locations (both default and non-default)
      const { data: locations, error: locationsError } = await supabase
        .from('storage_locations')
        .select('*')
        .eq('is_active', true);
      
      if (locationsError) throw locationsError;

      // Get all consumable location stock data with consumable details
      const { data: stockData, error: stockError } = await supabase
        .from('consumable_location_stock')
        .select(`
          *,
          consumables!inner(
            name,
            unit_cost,
            category
          ),
          storage_locations!inner(
            name,
            is_default
          )
        `)
        .gt('quantity', 0);
      
      if (stockError) throw stockError;

      // Also get direct consumable data that might not be in location stock yet
      const { data: consumables, error: consumablesError } = await supabase
        .from('consumables')
        .select('*')
        .eq('is_active', true);
      
      if (consumablesError) throw consumablesError;

      // Calculate summary data
      const totalLocations = locations?.length || 0;
      
      // Get unique consumables from both stock data and direct consumables
      const uniqueConsumablesFromStock = new Set(stockData?.map(item => item.consumable_id) || []);
      const totalConsumableTypes = Math.max(uniqueConsumablesFromStock.size, consumables?.length || 0);
      
      const totalStockValue = stockData?.reduce((sum, item) => 
        sum + (item.quantity * (item.consumables?.unit_cost || 0)), 0) || 0;

      // Calculate location details
      const locationDetails = locations?.map(location => {
        const locationStock = stockData?.filter(item => item.storage_location_id === location.id) || [];
        const consumableTypes = new Set(locationStock.map(item => item.consumable_id)).size;
        const totalUnits = locationStock.reduce((sum, item) => sum + item.quantity, 0);
        const totalValue = locationStock.reduce((sum, item) => 
          sum + (item.quantity * (item.consumables?.unit_cost || 0)), 0);

        return {
          location_id: location.id,
          location_name: location.name,
          description: location.description,
          is_default: location.is_default,
          consumable_types: consumableTypes,
          total_units: totalUnits,
          total_value: totalValue
        };
      }) || [];

      return {
        summary: {
          total_locations: totalLocations,
          total_consumable_types: totalConsumableTypes,
          total_stock_value: totalStockValue
        },
        location_details: locationDetails
      };
    }
  });

  const exportToPDF = async () => {
    if (!reportData) return;
    
    setIsExporting(true);
    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      let yPosition = 20;

      // Title
      pdf.setFontSize(20);
      pdf.text('Storage Location Report', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Date
      pdf.setFontSize(12);
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 20;

      // Summary
      pdf.setFontSize(16);
      pdf.text('Summary', 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.text(`Active Locations: ${reportData.summary.total_locations}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Consumable Types: ${reportData.summary.total_consumable_types}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Total Stock Value: $${reportData.summary.total_stock_value.toLocaleString()}`, 20, yPosition);
      yPosition += 20;

      // Location Details
      pdf.setFontSize(16);
      pdf.text('Location Details', 20, yPosition);
      yPosition += 10;

      reportData.location_details.forEach((location) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(`${location.location_name}${location.is_default ? ' (Default)' : ''}`, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        if (location.description) {
          pdf.text(location.description, 20, yPosition);
          yPosition += 6;
        }
        pdf.text(`${location.consumable_types} types • ${location.total_units} units`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Value: $${location.total_value.toLocaleString()}`, 20, yPosition);
        yPosition += 15;
      });

      pdf.save(`storage-location-report-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report exported successfully");
    } catch (error) {
      toast.error("Failed to export PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!reportData) return;

    const csvData = [
      ['Location Name', 'Description', 'Is Default', 'Consumable Types', 'Total Units', 'Total Value'],
      ...reportData.location_details.map(location => [
        location.location_name,
        location.description || '',
        location.is_default ? 'Yes' : 'No',
        location.consumable_types.toString(),
        location.total_units.toString(),
        location.total_value.toString()
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `storage-location-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("CSV report exported successfully");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={exportToPDF}
          disabled={isExporting || !reportData}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export PDF
        </Button>
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={!reportData}
          className="gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{reportData.summary.total_locations}</div>
                    <div className="text-sm text-muted-foreground">Active Locations</div>
                  </div>
                  <Building className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{reportData.summary.total_consumable_types}</div>
                    <div className="text-sm text-muted-foreground">Consumable Types</div>
                  </div>
                  <Package className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">
                      ${reportData.summary.total_stock_value.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Stock Value</div>
                  </div>
                  <DollarSign className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle>Location Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData.location_details.map((location) => (
                <Card key={location.location_id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{location.location_name}</h5>
                          {location.is_default && (
                            <Badge variant="secondary">Default</Badge>
                          )}
                        </div>
                        {location.description && (
                          <p className="text-sm text-muted-foreground">{location.description}</p>
                        )}
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-sm font-medium">
                          {location.consumable_types} types • {location.total_units} units
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ${location.total_value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}