import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Download, Search, Calendar as CalendarIcon, X, Package, Plus, Minus, RotateCcw, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { toast } from "sonner";

interface ProductStockHistoryEnhancedProps {
  productId: string;
  productName: string;
}

interface StockAdjustment {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: string;
  notes: string | null;
  created_at: string;
  adjusted_by?: string | null;
}

const adjustmentReasons = [
  { value: "damaged", label: "Damaged/Broken", icon: AlertTriangle },
  { value: "lost", label: "Lost/Missing", icon: Package },
  { value: "found", label: "Found/Recovered", icon: Package },
  { value: "maintenance", label: "Maintenance Return", icon: RotateCcw },
  { value: "purchase", label: "New Purchase", icon: Plus },
  { value: "correction", label: "Inventory Correction", icon: RotateCcw },
  { value: "other", label: "Other", icon: Package },
];

export function ProductStockHistoryEnhanced({ 
  productId, 
  productName 
}: ProductStockHistoryEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [quickDateFilter, setQuickDateFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("");

  // Quick date filter options
  const quickDateOptions = [
    { label: "All Time", value: "", days: null },
    { label: "Last 7 days", value: "7days", days: 7 },
    { label: "Last 30 days", value: "30days", days: 30 },
    { label: "Last 90 days", value: "90days", days: 90 },
    { label: "This Year", value: "year", days: null },
  ];

  const { data: stockHistory = [], isLoading } = useQuery({
    queryKey: ['stock-adjustments', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_adjustments')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockAdjustment[];
    }
  });

  // Apply quick date filter
  const applyQuickDateFilter = (value: string) => {
    setQuickDateFilter(value);
    const option = quickDateOptions.find(opt => opt.value === value);
    
    if (!option || value === "") {
      setDateRange(undefined);
      return;
    }

    const now = new Date();
    if (option.days) {
      const fromDate = new Date();
      fromDate.setDate(now.getDate() - option.days);
      setDateRange({ from: fromDate, to: now });
    } else if (value === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      setDateRange({ from: yearStart, to: now });
    }
  };

  // Apply filters to stock history
  const filteredHistory = useMemo(() => {
    if (!stockHistory) return [];
    
    return stockHistory.filter(adjustment => {
      // Text search filter
      const searchMatch = !searchTerm || 
        adjustment.reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adjustment.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        adjustment.adjusted_by?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Reason filter
      const reasonMatch = !reasonFilter || adjustment.reason === reasonFilter;
      
      // Date range filter - set end date to end of day to include all adjustments on that date
      let dateMatch = true;
      if (dateRange?.from && dateRange?.to) {
        const adjustmentDate = new Date(adjustment.created_at);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        dateMatch = adjustmentDate >= dateRange.from && adjustmentDate <= endDate;
      } else if (dateRange?.from) {
        const adjustmentDate = new Date(adjustment.created_at);
        dateMatch = adjustmentDate >= dateRange.from;
      } else if (dateRange?.to) {
        const adjustmentDate = new Date(adjustment.created_at);
        const endDate = new Date(dateRange.to);
        endDate.setHours(23, 59, 59, 999);
        dateMatch = adjustmentDate <= endDate;
      }
      
      return searchMatch && reasonMatch && dateMatch;
    });
  }, [stockHistory, searchTerm, reasonFilter, dateRange]);

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("No stock adjustment history to export");
      return;
    }

    const csvContent = [
      ['Date', 'Time', 'Quantity Change', 'Reason', 'Notes', 'Adjusted By'],
      ...filteredHistory.map(adjustment => [
        format(new Date(adjustment.created_at), 'yyyy-MM-dd'),
        format(new Date(adjustment.created_at), 'h:mm:ss a'),
        adjustment.quantity_change.toString(),
        adjustmentReasons.find(r => r.value === adjustment.reason)?.label || adjustment.reason,
        adjustment.notes || '',
        adjustment.adjusted_by || 'System'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${productName}-stock-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success("Stock history exported successfully");
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
    setQuickDateFilter("");
    setReasonFilter("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">
            Stock Adjustment History
          </CardTitle>
          <Button
            onClick={exportToCSV}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={filteredHistory.length === 0}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </div>
        
        {/* Quick Date Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickDateOptions.map((option) => (
            <Button
              key={option.value}
              variant={quickDateFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => applyQuickDateFilter(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* Filter Controls */}
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search notes or reasons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Reason Filter */}
          <div className="w-48">
            <Select value={reasonFilter} onValueChange={setReasonFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by reason" />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background border shadow-lg">
                <SelectItem value="">All Reasons</SelectItem>
                {adjustmentReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    <div className="flex items-center gap-2">
                      <reason.icon className="w-4 h-4" />
                      {reason.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Custom Date Range Picker */}
          <div className="w-80">
            <DatePickerWithRange
              date={dateRange}
              onDateChange={(range) => {
                setDateRange(range);
                setQuickDateFilter(""); // Clear quick filter when custom range is selected
              }}
              placeholder="Pick date range"
            />
          </div>
          
          {(searchTerm || dateRange?.from || dateRange?.to || quickDateFilter || reasonFilter) && (
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {stockHistory.length === 0 
              ? "No stock adjustments have been recorded for this product yet."
              : "No adjustments match your current filters."
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((adjustment) => {
              const reasonInfo = adjustmentReasons.find(r => r.value === adjustment.reason);
              const IconComponent = reasonInfo?.icon || Package;
              const isIncrease = adjustment.quantity_change > 0;
              
              return (
                <div
                  key={adjustment.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="text-sm text-muted-foreground min-w-[120px]">
                      <div className="font-medium text-foreground">
                        {format(new Date(adjustment.created_at), 'MMM dd, yyyy')}
                      </div>
                      <div>{format(new Date(adjustment.created_at), 'h:mm:ss a')}</div>
                    </div>
                    
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <Badge variant="outline" className="font-medium">
                          {reasonInfo?.label || adjustment.reason}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="text-right min-w-[100px]">
                      <div className={cn(
                        "font-medium text-lg",
                        isIncrease ? "text-green-600" : "text-red-600"
                      )}>
                        {isIncrease ? "+" : ""}{adjustment.quantity_change}
                      </div>
                      <div className="text-xs text-muted-foreground">units</div>
                    </div>
                  </div>
                  
                  {adjustment.notes && (
                    <div className="ml-4 max-w-[200px]">
                      <div className="text-xs text-muted-foreground truncate" title={adjustment.notes}>
                        {adjustment.notes}
                      </div>
                    </div>
                  )}
                  
                  <div className="ml-4 text-xs text-muted-foreground min-w-[80px] text-right">
                    {adjustment.adjusted_by || 'System'}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}