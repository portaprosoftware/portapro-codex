
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CalendarDays, Shield, Plus } from "lucide-react";
import { DeconCreateForm } from "./DeconCreateForm";

// Enhanced decon log type
type DeconLog = {
  id: string;
  performed_at: string;
  incident_id?: string | null;
  vehicle_areas?: string[] | null;
  location_type?: string | null;
  weather_conditions?: string | null;
  ppe_items?: string[] | null;
  ppe_compliance_status?: boolean | null;
  decon_methods?: string[] | null;
  post_inspection_status?: string | null;
  photos?: string[] | null;
  notes?: string | null;
};

interface DeconLogsTabProps {
  drawerOpen?: boolean;
  setDrawerOpen?: (open: boolean) => void;
}

export const DeconLogsTab: React.FC<DeconLogsTabProps> = ({ 
  drawerOpen: externalDrawerOpen, 
  setDrawerOpen: externalSetDrawerOpen 
}) => {
  const queryClient = useQueryClient();
  const [internalDrawerOpen, setInternalDrawerOpen] = useState(false);
  
  const drawerOpen = externalDrawerOpen ?? internalDrawerOpen;
  const setDrawerOpen = externalSetDrawerOpen ?? setInternalDrawerOpen;

  const { data, isLoading } = useQuery({
    queryKey: ["decon-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("decon_logs")
        .select("id, performed_at, incident_id, vehicle_areas, location_type, weather_conditions, ppe_items, ppe_compliance_status, decon_methods, post_inspection_status, photos, notes")
        .order("performed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data as DeconLog[]) ?? [];
    },
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const handleSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["decon-logs"] });
    setDrawerOpen(false);
  };

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!data || data.length === 0) {
    return (
      <>
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No decontamination logs</h3>
          <p className="text-muted-foreground mb-4">Record decon activities after a spill or exposure.</p>
          <Button 
            onClick={() => setDrawerOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold border-0"
          >
            <Plus className="w-4 h-4 mr-2" /> 
            Record Decon
          </Button>
        </Card>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[75vh]">
            <DrawerHeader>
              <DrawerTitle>Record Decontamination</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto flex-1">
              <DeconCreateForm 
                onSaved={handleSaved} 
                onCancel={() => setDrawerOpen(false)} 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-semibold">Decontamination Logs</h3>
          <p className="text-sm text-muted-foreground">Record decon activities after a spill or exposure</p>
        </div>
      </div>

      <div className="space-y-3">
        {data.map((log) => (
          <Card key={log.id} className="p-4 hover:shadow-lg transition-shadow">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    {new Date(log.performed_at).toLocaleString()}
                  </div>
                  <div className="mt-1 font-medium">
                    Incident: {log.incident_id ? log.incident_id.slice(0, 8) : "—"}
                    {log.location_type && ` • ${log.location_type.replace(/_/g, " ")}`}
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  {log.post_inspection_status === "pass" && (
                    <Badge className="bg-green-500 text-white">Pass</Badge>
                  )}
                  {log.post_inspection_status === "fail" && (
                    <Badge variant="destructive">Fail</Badge>
                  )}
                  {log.post_inspection_status === "conditional" && (
                    <Badge variant="secondary">Conditional</Badge>
                  )}
                  {log.photos && log.photos.length > 0 && (
                    <Badge variant="outline" className="gap-1">
                      {log.photos.length} photo{log.photos.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Areas Cleaned */}
              {log.vehicle_areas && log.vehicle_areas.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Areas Cleaned:</div>
                  <div className="flex flex-wrap gap-1">
                    {log.vehicle_areas.map((area, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {area.startsWith("other:") ? area.substring(6) : area.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Methods Used */}
              {log.decon_methods && log.decon_methods.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Methods:</div>
                  <div className="flex flex-wrap gap-1">
                    {log.decon_methods.map((method, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {method.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* PPE Info */}
              {log.ppe_items && log.ppe_items.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {log.ppe_items.length} PPE item{log.ppe_items.length > 1 ? "s" : ""}
                  </span>
                  {log.ppe_compliance_status && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                      Compliant
                    </Badge>
                  )}
                </div>
              )}

              {/* Weather */}
              {log.weather_conditions && (
                <div className="text-sm text-muted-foreground">
                  Weather: {log.weather_conditions}
                </div>
              )}

              {/* Notes */}
              {log.notes && (
                <div className="text-sm text-muted-foreground pt-2 border-t">
                  {log.notes}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Record Decontamination</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            <DeconCreateForm 
              onSaved={handleSaved} 
              onCancel={() => setDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
