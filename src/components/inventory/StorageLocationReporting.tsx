import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Warehouse, Package, DollarSign, Box, Shield, Droplet, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import jsPDF from 'jspdf';

interface LocationReportData {
  summary: {
    total_locations: number;
    total_consumable_types: number;
    total_product_types: number;
    total_stock_value: number;
    total_spill_kit_types: number;
    total_spill_kit_units: number;
    total_spill_kit_value: number;
  };
  consumable_details: Array<{
    location_id: string;
    location_name: string;
    items: Array<{
      item_name: string;
      category: string;
      quantity: number;
      unit_cost: number;
      total_value: number;
    }>;
    total_items: number;
    total_quantity: number;
    total_value: number;
  }>;
  spill_kit_details: Array<{
    location_id: string;
    location_name: string;
    items: Array<{
      item_name: string;
      item_type: string;
      quantity: number;
      unit_cost: number;
      total_value: number;
    }>;
    total_items: number;
    total_quantity: number;
    total_value: number;
  }>;
}

export function StorageLocationReporting() {
  const [isExporting, setIsExporting] = useState(false);
  const [expandedLocations, setExpandedLocations] = useState<Set<string>>(new Set());

  const toggleLocation = (locationId: string) => {
    setExpandedLocations(prev => {
      const newSet = new Set(prev);
      if (newSet.has(locationId)) {
        newSet.delete(locationId);
      } else {
        newSet.add(locationId);
      }
      return newSet;
    });
  };

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
        .select('id, name, category, unit_cost, unit_price, location_stock')
        .eq('is_active', true);
      
      if (consumablesError) throw consumablesError;

      // Get all products (product types) with stock in locations
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, stock_total')
        .eq('is_active', true)
        .gt('stock_total', 0);
      
      if (productsError) throw productsError;

      // Get spill kit inventory data
      const { data: spillKits, error: spillKitsError } = await supabase
        .from('spill_kit_inventory')
        .select('*');
      
      if (spillKitsError) throw spillKitsError;

      // Get spill kit location stock
      const { data: spillKitLocationStock, error: spillKitStockError } = await supabase
        .from('spill_kit_location_stock')
        .select('*');
      
      if (spillKitStockError) throw spillKitStockError;

      // Calculate summary data
      const totalLocations = locations?.length || 0;
      const totalConsumableTypes = consumables?.length || 0;
      const totalProductTypes = products?.length || 0;
      
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

      // Calculate spill kit summary
      const totalSpillKitTypes = spillKits?.length || 0;
      let totalSpillKitUnits = 0;
      let totalSpillKitValue = 0;
      
      spillKitLocationStock?.forEach(stock => {
        const item = spillKits?.find(kit => kit.id === stock.inventory_item_id);
        if (item) {
          totalSpillKitUnits += stock.quantity;
          totalSpillKitValue += stock.quantity * (item.unit_cost || 0);
        }
      });

      // Calculate consumable details by location (similar to spill kit details)
      const consumableDetails = locations?.map(location => {
        const items: Array<{
          item_name: string;
          category: string;
          quantity: number;
          unit_cost: number;
          total_value: number;
        }> = [];

        consumables?.forEach(consumable => {
          if (consumable.location_stock) {
            const locationStock = Array.isArray(consumable.location_stock) 
              ? consumable.location_stock 
              : JSON.parse(consumable.location_stock as string);
            
            const stockAtLocation = locationStock.find((stock: any) => stock.locationId === location.id);
            if (stockAtLocation && stockAtLocation.quantity > 0) {
              items.push({
                item_name: consumable.name,
                category: consumable.category || 'Uncategorized',
                quantity: stockAtLocation.quantity,
                unit_cost: consumable.unit_cost || 0,
                total_value: stockAtLocation.quantity * (consumable.unit_cost || 0)
              });
            }
          }
        });

        return {
          location_id: location.id,
          location_name: location.name,
          items: items.sort((a, b) => a.item_name.localeCompare(b.item_name)),
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_value: items.reduce((sum, item) => sum + item.total_value, 0)
        };
      }).filter(loc => loc.total_items > 0) || [];

      // Calculate spill kit details by location
      const spillKitDetails = locations?.map(location => {
        const locationStock = spillKitLocationStock?.filter(
          stock => stock.storage_location_id === location.id
        ) || [];

        const items = locationStock.map(stock => {
          const item = spillKits?.find(kit => kit.id === stock.inventory_item_id);
          return {
            item_name: item?.item_name || 'Unknown',
            item_type: item?.item_type || '',
            quantity: stock.quantity,
            unit_cost: item?.unit_cost || 0,
            total_value: stock.quantity * (item?.unit_cost || 0)
          };
        }).filter(item => item.quantity > 0);

        return {
          location_id: location.id,
          location_name: location.name,
          items,
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_value: items.reduce((sum, item) => sum + item.total_value, 0)
        };
      }).filter(loc => loc.total_items > 0) || [];

      return {
        summary: {
          total_locations: totalLocations,
          total_consumable_types: totalConsumableTypes,
          total_product_types: totalProductTypes,
          total_stock_value: totalStockValue,
          total_spill_kit_types: totalSpillKitTypes,
          total_spill_kit_units: totalSpillKitUnits,
          total_spill_kit_value: totalSpillKitValue
        },
        consumable_details: consumableDetails.sort((a, b) => 
          a.location_name.localeCompare(b.location_name)
        ),
        spill_kit_details: spillKitDetails.sort((a, b) => 
          a.location_name.localeCompare(b.location_name)
        )
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
      pdf.text(`Product Types: ${reportData.summary.total_product_types}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Total Stock Value: $${reportData.summary.total_stock_value.toLocaleString()}`, 20, yPosition);
      yPosition += 20;

      // Consumable Details
      pdf.setFontSize(16);
      pdf.text('Consumable Details by Location', 20, yPosition);
      yPosition += 10;

      reportData.consumable_details.forEach((location) => {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text(location.location_name, 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.text(`${location.total_items} items • ${location.total_quantity} units`, 20, yPosition);
        yPosition += 6;
        pdf.text(`Value: $${location.total_value.toLocaleString()}`, 20, yPosition);
        yPosition += 10;

        location.items.forEach((item) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.setFontSize(9);
          pdf.text(`  ${item.item_name} (${item.category})`, 25, yPosition);
          pdf.text(`${item.quantity} units - $${item.total_value.toLocaleString()}`, 120, yPosition);
          yPosition += 6;
        });
        yPosition += 10;
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
      ['Summary'],
      ['Active Garages', reportData.summary.total_locations.toString()],
      ['Consumable Types', reportData.summary.total_consumable_types.toString()],
      ['Product Types', reportData.summary.total_product_types.toString()],
      ['Total Stock Value', reportData.summary.total_stock_value.toString()],
      [],
      ['Location', 'Item Name', 'Category', 'Quantity', 'Unit Cost', 'Total Value'],
      ...reportData.consumable_details.flatMap(location => 
        location.items.map(item => [
          location.location_name,
          item.item_name,
          item.category,
          item.quantity.toString(),
          item.unit_cost.toString(),
          item.total_value.toString()
        ])
      )
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                  <Droplet className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{reportData.summary.total_product_types}</div>
                    <div className="text-sm text-muted-foreground">Product Types</div>
                  </div>
                  <Box className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{reportData.summary.total_spill_kit_types}</div>
                    <div className="text-sm text-muted-foreground">Spill Kit Types</div>
                  </div>
                  <Shield className="h-8 w-8 text-orange-500" />
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

          {/* Consumable Details by Location */}
          {reportData.consumable_details.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🧻</span>
                  Consumable Details by Location
                </CardTitle>
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
                {reportData.consumable_details.map((location) => (
                  <Collapsible
                    key={location.location_id}
                    open={expandedLocations.has(location.location_id)}
                    onOpenChange={() => toggleLocation(location.location_id)}
                  >
                    <Card className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <ChevronDown 
                                  className={`h-4 w-4 transition-transform ${
                                    expandedLocations.has(location.location_id) ? 'rotate-180' : ''
                                  }`}
                                />
                                <h5 className="font-medium text-lg">{location.location_name}</h5>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {location.total_items} consumables • {location.total_quantity} units
                                </div>
                                <div className="text-lg font-bold text-primary">
                                  ${location.total_value.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="space-y-2">
                            {location.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.item_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span>{item.quantity} units</span>
                                  <span className="font-medium text-foreground">
                                    ${(item.total_value).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Spill Kits by Location */}
          {reportData.spill_kit_details.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-orange-500" />
                  Spill Kits by Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {reportData.spill_kit_details.map((location) => (
                  <Collapsible
                    key={location.location_id}
                    open={expandedLocations.has(location.location_id + '_spill')}
                    onOpenChange={() => toggleLocation(location.location_id + '_spill')}
                  >
                    <Card className="border-l-4 border-l-orange-500">
                      <CardContent className="p-4">
                        <CollapsibleTrigger className="w-full">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <ChevronDown 
                                  className={`h-4 w-4 transition-transform ${
                                    expandedLocations.has(location.location_id + '_spill') ? 'rotate-180' : ''
                                  }`}
                                />
                                <h5 className="font-medium text-lg">{location.location_name}</h5>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-medium">
                                  {location.total_items} spill kit {location.total_items === 1 ? 'item' : 'items'} • {location.total_quantity} total units
                                </div>
                                <div className="text-lg font-bold text-orange-600">
                                  ${location.total_value.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-3">
                          <div className="space-y-2">
                            {location.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{item.item_name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-muted-foreground">
                                  <span>{item.quantity} units</span>
                                  <span className="font-medium text-foreground">
                                    ${(item.total_value).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}