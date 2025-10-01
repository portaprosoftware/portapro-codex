import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Warehouse, Package, DollarSign } from "lucide-react";
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

      // Get all consumables with their location_stock JSON data
      const { data: consumables, error: consumablesError } = await supabase
        .from('consumables')
        .select('id, name, unit_cost, unit_price, location_stock')
        .eq('is_active', true);
      
      if (consumablesError) throw consumablesError;

      // Calculate summary data
      const totalLocations = locations?.length || 0;
      const totalConsumableTypes = consumables?.length || 0;
      
      // Calculate total stock value from location_stock JSON
      let totalStockValue = 0;
      consumables?.forEach(consumable => {
        if (consumable.location_stock) {
          const locationStock = Array.isArray(consumable.location_stock) 
            ? consumable.location_stock 
            : JSON.parse(consumable.location_stock as string);
          
          locationStock.forEach((stock: any) => {
            totalStockValue += (stock.quantity || 0) * (consumable.unit_cost || 0);
          });
        }
      });

      // Calculate location details
      const locationDetails = locations?.map(location => {
        let consumableTypes = 0;
        let totalUnits = 0;
        let totalValue = 0;

        consumables?.forEach(consumable => {
          if (consumable.location_stock) {
            const locationStock = Array.isArray(consumable.location_stock) 
              ? consumable.location_stock 
              : JSON.parse(consumable.location_stock as string);
            
            const stockAtLocation = locationStock.find((stock: any) => stock.locationId === location.id);
            if (stockAtLocation && stockAtLocation.quantity > 0) {
              consumableTypes++;
              totalUnits += stockAtLocation.quantity;
              totalValue += stockAtLocation.quantity * (consumable.unit_cost || 0);
            }
          }
        });

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
        location_details: locationDetails.sort((a, b) => {
          // Default location always first
          if (a.is_default && !b.is_default) return -1;
          if (!a.is_default && b.is_default) return 1;
          
          // If both or neither are default, sort alphabetically
          return a.location_name.localeCompare(b.location_name);
        })
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
      pdf.text('Storage Garage Report', pageWidth / 2, yPosition, { align: 'center' });
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
      pdf.text(`Active Garages: ${reportData.summary.total_locations}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Consumable Types: ${reportData.summary.total_consumable_types}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Total Stock Value: $${reportData.summary.total_stock_value.toLocaleString()}`, 20, yPosition);
      yPosition += 20;

      // Garage Details
      pdf.setFontSize(16);
      pdf.text('Garage Details', 20, yPosition);
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

      pdf.save(`storage-garage-report-${new Date().toISOString().split('T')[0]}.pdf`);
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
      ['Garage Name', 'Description', 'Is Default', 'Consumable Types', 'Total Units', 'Total Value'],
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
    a.download = `storage-garage-report-${new Date().toISOString().split('T')[0]}.csv`;
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
      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{reportData.summary.total_locations}</div>
                    <div className="text-sm text-muted-foreground">Active Garages</div>
                  </div>
                  <Warehouse className="h-8 w-8 text-primary" />
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

          {/* Garage Details */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Garage Details</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  disabled={isExporting || !reportData}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToCSV}
                  disabled={!reportData}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {reportData.location_details.map((location) => (
                <Card key={location.location_id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
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