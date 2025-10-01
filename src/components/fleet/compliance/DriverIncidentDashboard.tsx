import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertTriangle, Calendar, MapPin, Eye, Plus, Truck } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { DriverIncidentLog } from "./DriverIncidentLog";
import { IncidentDetailsModal } from "./IncidentDetailsModal";
import { format } from "date-fns";

export const DriverIncidentDashboard: React.FC = () => {
  const { userId } = useUserRole();
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const { data: incidents, isLoading } = useQuery({
    queryKey: ["driver-incidents", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_incident_reports")
        .select(`
          *,
          vehicles(license_plate, make, model, year),
          incident_photos(id, photo_url),
          incident_witnesses(id, name, contact_info)
        `)
        .eq("driver_id", userId)
        .is("deleted_at", null)
        .order("incident_date", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_review":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
      case "under_investigation":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "open":
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0";
      case "closed":
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-400 to-gray-500 text-white font-bold border-0";
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "minor":
        return "bg-gradient-to-r from-green-500 to-green-600 text-white font-bold border-0";
      case "moderate":
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold border-0";
      case "major":
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold border-0";
      case "reportable":
        return "bg-gradient-to-r from-red-500 to-red-600 text-white font-bold border-0";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600 text-white font-bold border-0";
    }
  };

  const handleViewDetails = (incident: any) => {
    setSelectedIncident(incident);
    setIsDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Log Incident Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">My Incidents</h2>
          <p className="text-sm text-gray-600 mt-1">View your reported incidents</p>
        </div>
        <Button
          onClick={() => setIsLogDrawerOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Log Incident
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gradient-to-r from-yellow-500 to-yellow-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Pending Review</p>
              <p className="text-2xl font-bold text-white">
                {incidents?.filter((i: any) => i.status === "pending_review").length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Under Investigation</p>
              <p className="text-2xl font-bold text-white">
                {incidents?.filter((i: any) => i.status === "under_investigation" || i.status === "open").length || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-white" />
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-r from-gray-500 to-gray-600 border-0 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Closed</p>
              <p className="text-2xl font-bold text-white">
                {incidents?.filter((i: any) => i.status === "closed").length || 0}
              </p>
            </div>
            <Calendar className="w-8 h-8 text-white" />
          </div>
        </Card>
      </div>

      {/* Incident List */}
      <div className="space-y-4">
        {incidents?.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No incidents logged</h3>
            <p className="text-gray-600 mb-4">
              When you log incidents in the field, they'll appear here for tracking.
            </p>
            <Button
              onClick={() => setIsLogDrawerOpen(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Log First Incident
            </Button>
          </Card>
        ) : (
          incidents?.map((incident: any) => (
            <Card key={incident.id} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={getStatusColor(incident.status)}>
                      {incident.status.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity.replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Truck className="w-4 h-4" />
                      <span className="font-medium">{incident.vehicles?.license_plate || "Unknown Vehicle"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{format(new Date(incident.incident_date), "MMM dd, yyyy 'at' h:mm a")}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{incident.location_description}</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm font-medium text-gray-900">Spill Type: {incident.spill_type}</p>
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{incident.cause_description}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewDetails(incident)}
                  className="ml-4"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Log Incident Drawer */}
      <Drawer open={isLogDrawerOpen} onOpenChange={setIsLogDrawerOpen}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Log Incident</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 overflow-y-auto">
            <DriverIncidentLog
              onSaved={() => setIsLogDrawerOpen(false)}
              onCancel={() => setIsLogDrawerOpen(false)}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Detail Modal (Read-Only for Drivers) */}
      {selectedIncident && (
        <IncidentDetailsModal
          incident={selectedIncident}
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedIncident(null);
          }}
          onEdit={undefined} // Drivers cannot edit after submission
        />
      )}
    </div>
  );
};
