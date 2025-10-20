import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Warehouse, Shield, DollarSign } from "lucide-react";

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
      color: "text-blue-600"
    },
    {
      label: "Spill Kit Types",
      value: summary.total_spill_kit_types,
      icon: Shield,
      color: "text-orange-600"
    }
  ];

  return (
    <>
      {/* Total Stock Value */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xl lg:text-3xl font-bold">
                ${summary.total_stock_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-xs lg:text-base text-muted-foreground font-medium mt-1">
                Total Stock Value
              </div>
            </div>
            <div className="flex-shrink-0">
              <DollarSign className="h-5 w-5 lg:h-7 lg:w-7 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Combined Categories Card */}
      <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 lg:p-6">
          <div className="space-y-2 lg:space-y-3">
            <div className="text-xs lg:text-base text-muted-foreground font-semibold">
              Categories:
            </div>
            <div className="space-y-1.5 lg:space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-lg lg:text-2xl font-bold">{summary.total_consumable_types}</span>
                <span className="text-xs lg:text-base text-muted-foreground">Consumables</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg lg:text-2xl font-bold">{summary.total_product_types}</span>
                <span className="text-xs lg:text-base text-muted-foreground">Equipment</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {kpiCards.map((kpi, index) => (
        <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-xl lg:text-3xl font-bold">
                  {kpi.value}
                </div>
                <div className="text-xs lg:text-base text-muted-foreground font-medium mt-1">
                  {kpi.label}
                </div>
              </div>
              <div className="flex-shrink-0">
                <kpi.icon className={`h-5 w-5 lg:h-7 lg:w-7 ${kpi.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
