import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Package, DollarSign, User, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface RestockRequest {
  id: string;
  vehicle_id: string;
  template_id?: string;
  missing_items: any[];
  priority: string;
  status: string;
  estimated_cost?: number;
  notes?: string;
  requested_by?: string;
  assigned_to?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  vehicles: {
    license_plate: string;
    make?: string;
    model?: string;
    nickname?: string;
  };
}

export const RestockRequestManager: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch restock requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ["spill-kit-restock-requests", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("spill_kit_restock_requests")
        .select(`
          *,
          vehicles!inner(license_plate, make, model, nickname)
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RestockRequest[];
    }
  });

  // Update request status
  const { mutate: updateRequest } = useMutation({
    mutationFn: async ({ requestId, updates }: { requestId: string; updates: Partial<RestockRequest> }) => {
      const { error } = await supabase
        .from("spill_kit_restock_requests")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", requestId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spill-kit-restock-requests"] });
      toast({
        title: "Request Updated",
        description: "Restock request has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update restock request.",
        variant: "destructive"
      });
    }
  });

  const handleStatusChange = (requestId: string, status: string) => {
    const updates: Partial<RestockRequest> = { status };
    
    if (status === "completed") {
      updates.completed_at = new Date().toISOString();
    }

    updateRequest({ requestId, updates });
  };

  const handleAssignRequest = (requestId: string, assignedTo: string) => {
    updateRequest({ 
      requestId, 
      updates: { assigned_to: assignedTo, status: "in_progress" } 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold border-none">Completed</Badge>;
      case "in_progress":
        return <Badge className="bg-gradient-to-r from-blue-500 to-blue-700 text-white font-bold border-none">In Progress</Badge>;
      case "pending":
        return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white font-bold border-none">Pending</Badge>;
      default:
        return <Badge className="bg-gradient-to-r from-gray-400 to-gray-600 text-white font-bold border-none">Unknown</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Clock className="h-4 w-4" />;
      case "pending": return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const calculateTotalCost = () => {
    return requests?.reduce((total, request) => total + (request.estimated_cost || 0), 0) || 0;
  };

  const getRequestsByStatus = (status: string) => {
    return requests?.filter(request => request.status === status).length || 0;
  };

  if (isLoading) {
    return <div className="py-10 text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Restock Requests</h2>
          <p className="text-muted-foreground">Manage spill kit inventory restock requests</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="status-filter" className="text-sm">Filter by Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger id="status-filter" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Package className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{getRequestsByStatus("pending")}</div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-2xl font-bold">{getRequestsByStatus("in_progress")}</div>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-2xl font-bold">{getRequestsByStatus("completed")}</div>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-2xl font-bold">${calculateTotalCost().toFixed(2)}</div>
                <p className="text-sm text-muted-foreground">Total Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {requests?.map((request) => (
          <Card key={request.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(request.status)}
                    <div className="flex flex-col">
                      <h3 className="font-semibold">
                        {request.vehicles.make && request.vehicles.model 
                          ? `${request.vehicles.make} ${request.vehicles.model}${request.vehicles.nickname ? ` - ${request.vehicles.nickname}` : ''}`
                          : request.vehicles.license_plate
                        }
                      </h3>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {request.vehicles.license_plate}
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Missing Items</div>
                      <div className="text-muted-foreground">
                        {request.missing_items?.length || 0} items
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Estimated Cost</div>
                      <div className="text-muted-foreground">
                        ${request.estimated_cost?.toFixed(2) || "0.00"}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Created</div>
                      <div className="text-muted-foreground">
                        {format(new Date(request.created_at), "MM/dd/yyyy")}
                      </div>
                    </div>
                  </div>

                  {request.notes && (
                    <div className="mt-2">
                      <div className="font-medium text-sm">Notes</div>
                      <div className="text-muted-foreground text-sm">{request.notes}</div>
                    </div>
                  )}

                  {request.missing_items && request.missing_items.length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium text-sm">Missing Items:</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {request.missing_items.map((item: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {item.name} ({item.quantity})
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {request.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(request.id, "in_progress")}
                    >
                      Start
                    </Button>
                  )}
                  
                  {request.status === "in_progress" && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(request.id, "completed")}
                    >
                      Mark Complete
                    </Button>
                  )}

                  {request.status === "completed" && request.completed_at && (
                    <div className="text-sm text-muted-foreground">
                      Completed: {format(new Date(request.completed_at), "MM/dd/yyyy")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!requests || requests.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No Restock Requests</h3>
            <p className="text-muted-foreground">
              {statusFilter === "all" 
                ? "No restock requests have been created yet." 
                : `No ${statusFilter} restock requests found.`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};