import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Download, Plus, Minus, RotateCcw, FileText, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface ProductStockHistoryProps {
  productId: string;
  productName: string;
}

interface StockAdjustment {
  id: string;
  product_id: string;
  quantity_change: number;
  reason: string;
  notes?: string;
  adjusted_by: string;
  created_at: string;
}

export const ProductStockHistory: React.FC<ProductStockHistoryProps> = ({
  productId,
  productName,
}) => {
  const [quickDateFilter, setQuickDateFilter] = useState("");
  const [reasonFilter, setReasonFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });

  // Quick date filter options
  const quickDateOptions = [
    { label: "All Time", value: "", days: null },
    { label: "Last 7 days", value: "7days", days: 7 },
    { label: "Last 30 days", value: "30days", days: 30 },
    { label: "Last 90 days", value: "90days", days: 90 },
    { label: "This Year", value: "year", days: null },
  ];

  // Apply quick date filter
  const applyQuickDateFilter = (value: string) => {
    setQuickDateFilter(value);
    const option = quickDateOptions.find(opt => opt.value === value);
    
    if (!option || value === "") {
      setDateRange({ from: null, to: null });
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

  const { data: stockHistory, isLoading } = useQuery({
    queryKey: ["product-stock-history", productId, quickDateFilter, reasonFilter, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("stock_adjustments")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      // Apply custom date range filter (takes precedence over quick filter)
      if (dateRange.from || dateRange.to) {
        if (dateRange.from) {
          query = query.gte("created_at", dateRange.from.toISOString());
        }
        if (dateRange.to) {
          const endDate = new Date(dateRange.to);
          endDate.setHours(23, 59, 59, 999);
          query = query.lte("created_at", endDate.toISOString());
        }
      } else if (quickDateFilter !== "") {
        // Apply quick date filter only if no custom range is selected
        const option = quickDateOptions.find(opt => opt.value === quickDateFilter);
        if (option && option.days) {
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - option.days);
          query = query.gte("created_at", startDate.toISOString());
        } else if (quickDateFilter === "year") {
          const yearStart = new Date(new Date().getFullYear(), 0, 1);
          query = query.gte("created_at", yearStart.toISOString());
        }
      }

      // Apply reason filter
      if (reasonFilter !== "all") {
        query = query.eq("reason", reasonFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as StockAdjustment[];
    },
  });

  const filteredHistory = stockHistory?.filter((adjustment) =>
    searchTerm === "" ||
    adjustment.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adjustment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const uniqueReasons = [...new Set(stockHistory?.map(adj => adj.reason) || [])];

  const getAdjustmentIcon = (quantityChange: number) => {
    if (quantityChange > 0) return <Plus className="w-4 h-4 text-green-600" />;
    if (quantityChange < 0) return <Minus className="w-4 h-4 text-red-600" />;
    return <RotateCcw className="w-4 h-4 text-blue-600" />;
  };

  const getAdjustmentColor = (quantityChange: number) => {
    if (quantityChange > 0) return "bg-green-100 text-green-800 border-green-200";
    if (quantityChange < 0) return "bg-red-100 text-red-800 border-red-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  const exportToCSV = () => {
    if (!filteredHistory?.length) return;

    const headers = ["Date", "Adjustment Type", "Quantity Change", "Reason", "Notes", "Adjusted By"];
    const csvContent = [
      headers.join(","),
      ...filteredHistory.map(adj => [
        format(new Date(adj.created_at), "yyyy-MM-dd HH:mm:ss"),
        adj.quantity_change > 0 ? "Increase" : adj.quantity_change < 0 ? "Decrease" : "Adjustment",
        adj.quantity_change.toString(),
        `"${adj.reason}"`,
        `"${adj.notes || ""}"`,
        adj.adjusted_by
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${productName}_stock_history_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="h-9 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
        <div className="flex gap-4">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-80 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-40 h-10 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Export Button Row */}
      <div className="flex justify-end">
        <Button
          onClick={exportToCSV}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={!filteredHistory?.length}
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>
      
      {/* Quick Date Filters */}
      <div className="flex flex-wrap gap-2">
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
      <div className="flex gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search by reason or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Custom Date Range Picker */}
        <div className="w-80">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange.from && !dateRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "MMM dd, yyyy")} - {format(dateRange.to, "MMM dd, yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "MMM dd, yyyy")
                  )
                ) : (
                  <span>Pick date range</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from || new Date()}
                selected={{ from: dateRange.from || undefined, to: dateRange.to || undefined }}
                onSelect={(range) => {
                  setDateRange({ 
                    from: range?.from || null, 
                    to: range?.to || null 
                  });
                  setQuickDateFilter(""); // Clear quick filter when custom range is selected
                }}
                numberOfMonths={2}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All reasons</SelectItem>
            {uniqueReasons.map(reason => (
              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Content */}
      {!filteredHistory?.length ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No stock adjustments found for the selected filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((adjustment) => (
            <div
              key={adjustment.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-4">
                {getAdjustmentIcon(adjustment.quantity_change)}
                
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">
                      {format(new Date(adjustment.created_at), "MMM dd, yyyy")}
                    </span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(adjustment.created_at), "HH:mm")}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{adjustment.reason}</span>
                    {adjustment.notes && (
                      <span className="ml-2">• {adjustment.notes}</span>
                    )}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <Badge 
                  variant="outline" 
                  className={`font-medium ${getAdjustmentColor(adjustment.quantity_change)}`}
                >
                  {adjustment.quantity_change > 0 ? "+" : ""}{adjustment.quantity_change}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};