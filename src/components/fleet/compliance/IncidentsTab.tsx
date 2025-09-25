
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { AlertTriangle, MapPin, Plus } from "lucide-react";
import { IncidentCreateForm } from "./IncidentCreateForm";

export const IncidentsTab: React.FC = () => {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["spill-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_incident_reports")
        .select("id, created_at, vehicle_id, location_description, immediate_action_taken, spill_type")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
    retry: 0,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  });

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["spill-incidents"] });
    setDrawerOpen(false);
  };

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No spill incidents recorded</h3>
        <p className="text-muted-foreground mb-4">When incidents are logged, they’ll show up here.</p>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Incident
        </Button>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[50vh]">
            <DrawerHeader>
              <DrawerTitle>Log New Incident</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto flex-1">
              <IncidentCreateForm 
                onSaved={handleSaved} 
                onCancel={() => setDrawerOpen(false)} 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Incidents</h3>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Log Incident
        </Button>
      </div>

      <div className="space-y-3">
        {data.map((inc: any) => (
          <Card key={inc.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground">
                  {new Date(inc.created_at).toLocaleString()}
                </div>
                <div className="mt-1 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {inc.location_description || "Location not specified"}
                </div>
                {inc.immediate_action_taken && (
                  <div className="text-sm text-muted-foreground mt-1">
                    Action: {inc.immediate_action_taken}
                  </div>
                )}
              </div>
              <Badge variant="destructive">Incident</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[50vh]">
          <DrawerHeader>
            <DrawerTitle>Log New Incident</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            <IncidentCreateForm 
              onSaved={handleSaved} 
              onCancel={() => setDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
