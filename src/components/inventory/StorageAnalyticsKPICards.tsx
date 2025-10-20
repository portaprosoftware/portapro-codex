import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, Droplet, Package, Shield, DollarSign } from "lucide-react";

interface KPICardsProps {
  summary: {
    total_locations: number;
    total_consumable_types: number;
    total_product_types: number;
    total_stock_value: number;
    total_spill_kit_types: number;
  };
}

export function StorageAnalyticsKPICards({ summary }: KPICardsProps) {
  const kpiCards = [
    {
      label: "Active Garage Site Locations",
      value: summary.total_locations,
      icon: Warehouse,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconPadding: "p-2"
    },
    {
      label: "Consumable Types",
      value: summary.total_consumable_types,
      icon: Droplet,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconPadding: "p-2.5"
    },
    {
      label: "Product Types",
      value: summary.total_product_types,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      iconPadding: "p-2"
    },
    {
      label: "Spill Kit Types",
      value: summary.total_spill_kit_types,
      icon: Shield,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      iconPadding: "p-2"
    }
  ];

  return (
    <>
      {/* Total Stock Value - Full Width on Mobile */}
      <Card className="col-span-full lg:col-span-1 overflow-hidden">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-2xl lg:text-3xl font-bold">
                ${summary.total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-sm lg:text-base text-muted-foreground font-medium mt-1">
                Total Stock Value
              </div>
            </div>
            <div className="flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
              <DollarSign className="h-5 w-5 lg:h-6 lg:w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Grid - 2 columns on mobile, 4 on desktop */}
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-2xl lg:text-3xl font-bold">
                  {kpi.value}
                </div>
                <div className="text-sm lg:text-base text-muted-foreground font-medium mt-1">
                  {kpi.label}
                </div>
              </div>
              <div className={`flex-shrink-0 w-10 h-10 lg:w-12 lg:h-12 rounded-full ${kpi.bgColor} flex items-center justify-center ${kpi.iconPadding || 'p-2'}`}>
                <kpi.icon className={`h-full w-full ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
