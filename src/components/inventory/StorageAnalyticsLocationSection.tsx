import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface LocationItem {
  item_name: string;
  quantity: number;
  unit_cost?: number;
  total_value?: number;
  category?: string;
  item_type?: string;
}

interface LocationData {
  location_id: string;
  location_name: string;
  items: LocationItem[];
  total_items: number;
  total_quantity: number;
  total_value?: number;
}

interface SectionProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  borderColor: string;
  data: LocationData[];
  onExportPDF: () => void;
  onExportCSV: () => void;
  isExporting?: boolean;
  showValue?: boolean;
  showCategory?: boolean;
  showItemType?: boolean;
}

export function StorageAnalyticsLocationSection({
  title,
  icon: Icon,
  iconColor,
  borderColor,
  data,
  onExportPDF,
  onExportCSV,
  isExporting = false,
  showValue = false,
  showCategory = false,
  showItemType = false
}: SectionProps) {
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

  if (data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
            <Icon className={`h-5 w-5 lg:h-6 lg:w-6 ${iconColor}`} />
            {title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onExportPDF}
              disabled={isExporting}
              className="text-xs lg:text-sm h-9"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExportCSV}
              disabled={isExporting}
              className="text-xs lg:text-sm h-9"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pb-6">
        {data.map((location) => {
          const isExpanded = expandedLocations.has(location.location_id);
          
          return (
            <Collapsible
              key={location.location_id}
              open={isExpanded}
              onOpenChange={() => toggleLocation(location.location_id)}
            >
              <Card className={`border-l-4 ${borderColor} shadow-sm`}>
                <CollapsibleTrigger className="w-full">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base mb-2">
                          {location.location_name}
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>
                            {location.total_items} {showItemType ? 'spill kit items' : showCategory ? 'consumables' : 'product types'} • {location.total_quantity} total units
                          </div>
                          {showValue && location.total_value !== undefined && (
                            <div className="font-semibold text-blue-600">
                              Cost of Goods: ${location.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="pt-0 pb-4 px-4">
                    <div className="space-y-2 mt-2">
                      {location.items.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-3 py-2 border-t first:border-t-0 text-sm"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium break-words">
                              {item.item_name}
                            </div>
                            {showCategory && item.category && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.category}
                              </div>
                            )}
                            {showItemType && item.item_type && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.item_type}
                              </div>
                            )}
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="font-medium">
                              {item.quantity} units
                            </div>
                            {showValue && item.unit_cost !== undefined && (
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {item.quantity} × ${item.unit_cost.toFixed(2)} = ${(item.total_value || 0).toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {showValue && location.total_value !== undefined && (
                      <div className="mt-4 pt-3 border-t flex justify-between items-center font-semibold">
                        <span className="text-orange-600">Total:</span>
                        <span className="text-orange-600">
                          ${location.total_value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </CardContent>
    </Card>
  );
}
