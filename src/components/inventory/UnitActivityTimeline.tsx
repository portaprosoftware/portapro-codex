import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Clock, 
  MapPin, 
  Wrench, 
  TrendingUp, 
  Package, 
  Users, 
  Calendar,
  Download,
  Filter,
  ArrowUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ActivityEvent {
  id: string;
  timestamp: string;
  type: 'maintenance' | 'transfer' | 'assignment' | 'status_change' | 'creation';
  title: string;
  description: string;
  details?: any;
  icon: React.ComponentType<any>;
  iconColor: string;
}

interface UnitActivityTimelineProps {
  itemId: string;
  itemCode: string;
}

export const UnitActivityTimeline: React.FC<UnitActivityTimelineProps> = ({ 
  itemId, 
  itemCode 
}) => {
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [activityFilter, setActivityFilter] = useState<string>("all");

  const { data: activities, isLoading } = useQuery({
    queryKey: ["unit-activity-timeline", itemId],
    queryFn: async () => {
      const events: ActivityEvent[] = [];

      // Fetch maintenance updates
      const { data: maintenanceData } = await supabase
        .from("maintenance_updates")
        .select(`
          id,
          created_at,
          update_type,
          description,
          cost_amount,
          technician_name,
          parts_used
        `)
        .eq("item_id", itemId)
        .order("created_at", { ascending: false });

      if (maintenanceData) {
        maintenanceData.forEach((update) => {
          events.push({
            id: `maintenance-${update.id}`,
            timestamp: update.created_at,
            type: 'maintenance',
            title: `Maintenance: ${update.update_type}`,
            description: update.description || "Maintenance work performed",
            details: {
              technician: update.technician_name,
              cost: update.cost_amount,
              parts: update.parts_used
            },
            icon: Wrench,
            iconColor: "text-orange-600"
          });
        });
      }

      // Fetch location transfers
      const { data: transferData } = await supabase
        .from("product_item_location_transfers")
        .select(`
          id,
          transferred_at,
          from_location_id,
          to_location_id,
          quantity,
          notes,
          from_locations:storage_locations!product_item_location_transfers_from_location_id_fkey(name),
          to_locations:storage_locations!product_item_location_transfers_to_location_id_fkey(name)
        `)
        .eq("product_item_id", itemId)
        .order("transferred_at", { ascending: false });

      if (transferData) {
        transferData.forEach((transfer) => {
          events.push({
            id: `transfer-${transfer.id}`,
            timestamp: transfer.transferred_at,
            type: 'transfer',
            title: "Location Transfer",
            description: `Moved from ${transfer.from_locations?.name || 'Unknown'} to ${transfer.to_locations?.name || 'Unknown'}`,
            details: {
              fromLocation: transfer.from_locations?.name,
              toLocation: transfer.to_locations?.name,
              quantity: transfer.quantity,
              notes: transfer.notes
            },
            icon: MapPin,
            iconColor: "text-blue-600"
          });
        });
      }

      // Fetch equipment assignments (jobs)
      const { data: assignmentData } = await supabase
        .from("equipment_assignments")
        .select(`
          id,
          created_at,
          assigned_date,
          return_date,
          status,
          job_id,
          jobs!inner(
            job_number,
            customer_id,
            customers!inner(name)
          )
        `)
        .eq("product_item_id", itemId)
        .order("created_at", { ascending: false });

      if (assignmentData) {
        assignmentData.forEach((assignment) => {
          events.push({
            id: `assignment-${assignment.id}`,
            timestamp: assignment.created_at,
            type: 'assignment',
            title: `Job Assignment: ${assignment.jobs.job_number}`,
            description: `Assigned to ${assignment.jobs.customers.name}`,
            details: {
              jobNumber: assignment.jobs.job_number,
              customer: assignment.jobs.customers.name,
              assignedDate: assignment.assigned_date,
              returnDate: assignment.return_date,
              status: assignment.status
            },
            icon: Users,
            iconColor: "text-green-600"
          });
        });
      }

      // Add creation event (from product_items table)
      const { data: itemData } = await supabase
        .from("product_items")
        .select("created_at, updated_at")
        .eq("id", itemId)
        .single();

      if (itemData) {
        events.push({
          id: `creation-${itemId}`,
          timestamp: itemData.created_at,
          type: 'creation',
          title: "Unit Created",
          description: `Individual unit ${itemCode} was created in the system`,
          details: {},
          icon: Package,
          iconColor: "text-purple-600"
        });
      }

      // Sort events by timestamp
      return events.sort((a, b) => {
        const direction = sortOrder === "desc" ? -1 : 1;
        return direction * (new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
    }
  });

  // Filter out creation events and apply activity type filter
  const filteredActivities = activities?.filter(activity => {
    if (activity.type === 'creation') return false;
    if (activityFilter === 'all') return true;
    return activity.type === activityFilter;
  }) || [];

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const exportTimeline = () => {
    if (!filteredActivities.length) {
      toast.error("No data to export");
      return;
    }

    const csvContent = [
      ["Timestamp", "Type", "Title", "Description", "Details"].join(","),
      ...filteredActivities.map(activity => [
        activity.timestamp,
        activity.type,
        `"${activity.title}"`,
        `"${activity.description}"`,
        `"${JSON.stringify(activity.details)}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `unit-activity-${itemCode}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success("Activity timeline exported successfully");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
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
            <Clock className="w-5 h-5" />
            Activity Timeline
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={activityFilter} onValueChange={setActivityFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="transfer">Transfers</SelectItem>
                <SelectItem value="assignment">Assignments</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
            >
              <ArrowUpDown className="w-4 h-4 mr-1" />
              {sortOrder === "desc" ? "Newest" : "Oldest"}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={exportTimeline}
              disabled={!filteredActivities.length}
            >
              <Download className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredActivities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No activity found for this unit</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            <div className="space-y-6">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className={`relative flex-shrink-0 w-8 h-8 rounded-full border-2 border-white bg-white shadow-sm flex items-center justify-center z-10`}>
                    <activity.icon className={`w-4 h-4 ${activity.iconColor}`} />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 pb-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{activity.title}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                        <div className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTimestamp(activity.timestamp)}
                        </div>
                        
                        {/* Activity-specific details */}
                        {activity.type === 'maintenance' && activity.details && (
                          <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              {activity.details.technician && (
                                <div>
                                  <span className="font-medium">Technician:</span> {activity.details.technician}
                                </div>
                              )}
                              {activity.details.cost && (
                                <div>
                                  <span className="font-medium">Cost:</span> ${activity.details.cost}
                                </div>
                              )}
                              {activity.details.parts && (
                                <div className="col-span-2">
                                  <span className="font-medium">Parts:</span> {activity.details.parts}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {activity.type === 'transfer' && activity.details && (
                          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">From:</span> {activity.details.fromLocation || 'Unknown'}
                              </div>
                              <div>
                                <span className="font-medium">To:</span> {activity.details.toLocation || 'Unknown'}
                              </div>
                              {activity.details.notes && (
                                <div className="col-span-2">
                                  <span className="font-medium">Notes:</span> {activity.details.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {activity.type === 'assignment' && activity.details && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Job:</span> {activity.details.jobNumber}
                              </div>
                              <div>
                                <span className="font-medium">Customer:</span> {activity.details.customer}
                              </div>
                              {activity.details.assignedDate && (
                                <div>
                                  <span className="font-medium">Assigned:</span> {new Date(activity.details.assignedDate).toLocaleDateString()}
                                </div>
                              )}
                              {activity.details.returnDate && (
                                <div>
                                  <span className="font-medium">Return:</span> {new Date(activity.details.returnDate).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};