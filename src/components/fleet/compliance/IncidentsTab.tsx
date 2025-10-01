import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { EnhancedIncidentForm } from "./EnhancedIncidentForm";
import { EnhancedIncidentCard } from "./EnhancedIncidentCard";
import { IncidentDetailsModal } from "./IncidentDetailsModal";
import { IncidentAnalyticsCard } from "./IncidentAnalyticsCard";
import { Plus, Calendar, MapPin, Filter, TrendingUp, Download } from "lucide-react";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const IncidentsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [severityFilter, setSeverityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: incidents, isLoading, error } = useQuery({
    queryKey: ["spill-incident-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_incident_reports")
        .select(`
          *,
          vehicles!inner(license_plate),
          incident_photos(*),
          incident_witnesses(*)
        `)
        .is('deleted_at', null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleSaved = async () => {
    queryClient.invalidateQueries({ queryKey: ["spill-incident-reports"] });
    setIsDrawerOpen(false);
    
    // Trigger notification if needed
    const lastIncident = incidents?.[0];
    if (lastIncident && ['major', 'reportable'].includes(lastIncident.severity)) {
      try {
        await supabase.functions.invoke('notify-incident', {
          body: {
            incident_id: lastIncident.id,
            severity: lastIncident.severity,
            spill_type: lastIncident.spill_type,
            location_description: lastIncident.location_description,
          }
        });
      } catch (error) {
        console.error("Notification error:", error);
      }
    }
  };

  const handleViewDetails = (incident: any) => {
    setSelectedIncident(incident);
    setIsDetailsModalOpen(true);
  };

  const handleExport = async () => {
    try {
      const { data, error } = await supabase.rpc('export_incident_data', {
        start_date: null,
        end_date: null,
        severity_filter: severityFilter === 'all' ? null : severityFilter,
        status_filter: statusFilter === 'all' ? null : statusFilter,
      });

      if (error) throw error;

      // Convert to CSV
      if (!data || data.length === 0) {
        toast({ title: "No Data", description: "No incidents to export" });
        return;
      }

      const headers = Object.keys(data[0]).join(',');
      const rows = data.map((row: any) => 
        Object.values(row).map(val => 
          typeof val === 'string' ? `"${val}"` : val
        ).join(',')
      );
      const csv = [headers, ...rows].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({ title: "Success", description: "Incidents exported successfully" });
    } catch (error) {
      console.error("Export error:", error);
      toast({ title: "Error", description: "Failed to export incidents", variant: "destructive" });
    }
  };

  // Filter incidents based on severity and status
  const filteredIncidents = incidents?.filter((incident) => {
    const severityMatch = severityFilter === "all" || incident.severity === severityFilter;
    const statusMatch = statusFilter === "all" || incident.status === statusFilter;
    return severityMatch && statusMatch;
  }) || [];

  // Analytics calculations
  const analytics = {
    total: incidents?.length || 0,
    open: incidents?.filter(i => i.status === 'open').length || 0,
    major: incidents?.filter(i => i.severity === 'major' || i.severity === 'reportable').length || 0,
    regulatory: incidents?.filter(i => i.regulatory_notification_required).length || 0,
  };

  if (isLoading) {
    return <div className="p-8 text-center">Loading incidents...</div>;
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error loading incidents: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Analytics Cards */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold">Incident Management</h2>
          <p className="text-muted-foreground">Comprehensive spill incident tracking and compliance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsDrawerOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="mr-2 h-4 w-4" />
            Log New Incident
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Incidents</p>
                <p className="text-2xl font-bold">{analytics.total}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Cases</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.open}</p>
              </div>
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Major Incidents</p>
                <p className="text-2xl font-bold text-red-600">{analytics.major}</p>
              </div>
              <MapPin className="h-5 w-5 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Regulatory Reports</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.regulatory}</p>
              </div>
              <Filter className="h-5 w-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Overview Chart */}
      <IncidentAnalyticsCard />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
            <SelectItem value="moderate">Moderate</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="reportable">Reportable</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-white">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Incidents List */}
      {filteredIncidents.length === 0 ? (
        <div className="text-center py-12">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">
              {incidents?.length === 0 ? "No incidents recorded" : "No incidents match your filters"}
            </h3>
            <p className="text-gray-600 mb-4">
              {incidents?.length === 0 
                ? "Get started by logging your first spill incident."
                : "Try adjusting your filters to see more results."
              }
            </p>
            {incidents?.length === 0 && (
              <Button onClick={() => setIsDrawerOpen(true)} className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Log First Incident
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredIncidents.map((incident) => (
            <EnhancedIncidentCard
              key={incident.id}
              incident={incident}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}

      {/* Create Incident Drawer */}
      <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <DrawerContent className="max-h-[95vh]">
          <DrawerHeader>
            <DrawerTitle>Log New Spill Incident</DrawerTitle>
          </DrawerHeader>
          <div className="px-6 pb-6">
            <EnhancedIncidentForm 
              onSaved={handleSaved} 
              onCancel={() => setIsDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Incident Details Modal */}
      <IncidentDetailsModal
        incident={selectedIncident}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={(incident) => {
          setSelectedIncident(incident);
          setIsDetailsModalOpen(false);
          setIsDrawerOpen(true);
        }}
      />
    </div>
  );
};