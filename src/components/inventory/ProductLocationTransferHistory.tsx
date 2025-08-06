import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Download, Search, Calendar } from "lucide-react";
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
  const [selectedDate, setSelectedDate] = useState("");

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

  const filteredHistory = transferHistory.filter(transfer => {
    const matchesSearch = searchTerm === "" || 
      transfer.from_location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transfer.to_location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transfer.notes && transfer.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDate = selectedDate === "" || 
      format(new Date(transfer.transferred_at), 'yyyy-MM-dd') === selectedDate;
    
    return matchesSearch && matchesDate;
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
          <div className="w-48">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {(searchTerm || selectedDate) && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedDate("");
              }}
            >
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