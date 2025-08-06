import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ArrowRight, Download, Search, Calendar as CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

interface ProductLocationTransferHistoryProps {
  productId: string;
  productName: string;
}

interface LocationTransfer {
  id: string;
  product_id: string;
  from_location_id: string;
  to_location_id: string;
  quantity: number;
  transferred_at: string;
  transferred_by: string | null;
  notes: string | null;
  from_location: {
    id: string;
    name: string;
  };
  to_location: {
    id: string;
    name: string;
  };
}

export function ProductLocationTransferHistory({ 
  productId, 
  productName 
}: ProductLocationTransferHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null }>({
    from: null,
    to: null
  });
  const [quickDateFilter, setQuickDateFilter] = useState("");

  // Quick date filter options
  const quickDateOptions = [
    { label: "All Time", value: "", days: null },
    { label: "Last 7 days", value: "7days", days: 7 },
    { label: "Last 30 days", value: "30days", days: 30 },
    { label: "Last 90 days", value: "90days", days: 90 },
    { label: "This Year", value: "year", days: null },
  ];

  const { data: transferHistory = [], isLoading } = useQuery({
    queryKey: ['product-location-transfers', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_location_transfers')
        .select(`
          *,
          from_location:storage_locations!from_location_id(id, name),
          to_location:storage_locations!to_location_id(id, name)
        `)
        .eq('product_id', productId)
        .order('transferred_at', { ascending: false });

      if (error) throw error;
      return data as LocationTransfer[];
    }
  });

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

  const filteredHistory = transferHistory.filter(transfer => {
    const transferDate = new Date(transfer.transferred_at);
    
    const matchesSearch = searchTerm === "" || 
      transfer.from_location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transfer.notes && transfer.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDateRange = (!dateRange.from || transferDate >= dateRange.from) &&
                            (!dateRange.to || transferDate <= dateRange.to);
    
    return matchesSearch && matchesDateRange;
  });

  const exportToCSV = () => {
    if (filteredHistory.length === 0) {
      toast.error("No transfer history to export");
      return;
    }

    const headers = ["Date", "Time", "From Location", "To Location", "Quantity", "Notes", "Transferred By"];
    const csvContent = [
      headers.join(","),
      ...filteredHistory.map(transfer => [
        format(new Date(transfer.transferred_at), 'yyyy-MM-dd'),
        format(new Date(transfer.transferred_at), 'HH:mm:ss'),
        `"${transfer.from_location.name}"`,
        `"${transfer.to_location.name}"`,
        transfer.quantity,
        `"${transfer.notes || ''}"`,
        `"${transfer.transferred_by || 'System'}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${productName}-transfer-history-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    
    toast.success("Transfer history exported successfully");
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
            Location Transfer History
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
                placeholder="Search locations or notes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          {/* Custom Date Range Picker */}
          <div className="w-64">
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
          
          {(searchTerm || dateRange.from || dateRange.to || quickDateFilter) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setDateRange({ from: null, to: null });
                setQuickDateFilter("");
              }}
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
            {transferHistory.length === 0 
              ? "No location transfers have been recorded for this product yet."
              : "No transfers match your current filters."
            }
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((transfer) => (
              <div
                key={transfer.id}
                className="flex items-center justify-between p-4 border rounded-lg bg-card"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="text-sm text-muted-foreground min-w-[120px]">
                    <div className="font-medium text-foreground">
                      {format(new Date(transfer.transferred_at), 'MMM dd, yyyy')}
                    </div>
                    <div>{format(new Date(transfer.transferred_at), 'HH:mm:ss')}</div>
                  </div>
                  
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge variant="outline" className="font-medium">
                      {transfer.from_location.name}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="font-medium">
                      {transfer.to_location.name}
                    </Badge>
                  </div>
                  
                  <div className="text-right min-w-[80px]">
                    <div className="font-medium text-lg">
                      {transfer.quantity}
                    </div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </div>
                </div>
                
                {transfer.notes && (
                  <div className="ml-4 max-w-[200px]">
                    <div className="text-xs text-muted-foreground truncate" title={transfer.notes}>
                      {transfer.notes}
                    </div>
                  </div>
                )}
                
                <div className="ml-4 text-xs text-muted-foreground min-w-[80px] text-right">
                  {transfer.transferred_by || 'System'}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}