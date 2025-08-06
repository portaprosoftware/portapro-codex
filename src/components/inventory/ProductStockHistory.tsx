import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Download, Plus, Minus, RotateCcw, FileText } from "lucide-react";
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
  };

  const { data: stockHistory, isLoading } = useQuery({
    queryKey: ["product-stock-history", productId, quickDateFilter, reasonFilter],
    queryFn: async () => {
      let query = supabase
        .from("stock_adjustments")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

      // Apply date filter based on quick filter
      if (quickDateFilter !== "") {
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Stock Adjustment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Stock Adjustment History
          </CardTitle>
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
            <Input
              placeholder="Search by reason or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
      </CardHeader>
      
      <CardContent>
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
      </CardContent>
    </Card>
  );
};