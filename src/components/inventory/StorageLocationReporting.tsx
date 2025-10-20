import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { StorageAnalyticsKPICards } from "./StorageAnalyticsKPICards";
import { StorageAnalyticsLocationSection } from "./StorageAnalyticsLocationSection";
import { Droplet, Package, Shield } from "lucide-react";
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
  product_details: Array<{
    location_id: string;
    location_name: string;
    items: Array<{
      item_name: string;
      quantity: number;
    }>;
    total_items: number;
    total_quantity: number;
  }>;
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

      // Get product location stock
      const { data: productLocationStock, error: productLocationError } = await supabase
        .from('product_location_stock')
        .select(`
          *,
          storage_locations(id, name),
          products(id, name)
        `);
      
      if (productLocationError) throw productLocationError;

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

      // Calculate product details by location
      const productDetails = locations?.map(location => {
        const locationStock = productLocationStock?.filter(
          (stock: any) => stock.storage_location_id === location.id
        ) || [];

        const items = locationStock.map((stock: any) => {
          return {
            item_name: stock.products?.name || 'Unknown Product',
            quantity: stock.quantity || 0
          };
        }).filter(item => item.quantity > 0);

        return {
          location_id: location.id,
          location_name: location.name,
          items: items.sort((a, b) => a.item_name.localeCompare(b.item_name)),
          total_items: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0)
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
        product_details: productDetails.sort((a, b) => 
          a.location_name.localeCompare(b.location_name)
        ),
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
      pdf.text(`Active Garage Site Locations: ${reportData.summary.total_locations}`, 20, yPosition);
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
      ['Active Garage Site Locations', reportData.summary.total_locations.toString()],
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
      <div className="px-4 overflow-x-hidden">
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-muted rounded-xl h-24 lg:h-28"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 overflow-x-hidden">
      <div className="space-y-6 pb-6">
        {reportData && (
          <>
            {/* KPI Cards - Mobile First Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
              <StorageAnalyticsKPICards summary={reportData.summary} />
            </div>

            {/* Consumable Details by Location */}
            <StorageAnalyticsLocationSection
              title="Consumable Details by Location"
              icon={Droplet}
              iconColor="text-blue-600"
              borderColor="border-l-blue-600"
              data={reportData.consumable_details}
              onExportPDF={exportToPDF}
              onExportCSV={exportToCSV}
              isExporting={isExporting}
              showValue={true}
              showCategory={true}
            />

            {/* Product Types by Location */}
            <StorageAnalyticsLocationSection
              title="Product Types by Location"
              icon={Package}
              iconColor="text-blue-600"
              borderColor="border-l-blue-600"
              data={reportData.product_details}
              onExportPDF={exportToPDF}
              onExportCSV={exportToCSV}
              isExporting={isExporting}
              showValue={false}
            />

            {/* Spill Kits by Location */}
            <StorageAnalyticsLocationSection
              title="Spill Kits by Location"
              icon={Shield}
              iconColor="text-orange-600"
              borderColor="border-l-orange-600"
              data={reportData.spill_kit_details}
              onExportPDF={exportToPDF}
              onExportCSV={exportToCSV}
              isExporting={isExporting}
              showValue={true}
              showItemType={true}
            />
          </>
        )}
      </div>
    </div>
  );
}