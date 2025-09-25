
import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { CalendarDays, Shield, Plus } from "lucide-react";
import { DeconCreateForm } from "./DeconCreateForm";

// Local fallback type
type DeconLog = {
  id: string;
  performed_at: string;
  incident_id?: string | null;
  vehicle_area?: string | null;
  ppe_used?: string | null;
  notes?: string | null;
};

export const DeconLogsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["decon-logs"],
    queryFn: async () => {
      // Select only columns that exist on public.decon_logs and limit for perf
      const { data, error } = await supabase
        .from("decon_logs")
        .select("id, performed_at, incident_id, vehicle_area, ppe_used, notes")
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
      <Card className="p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No decontamination logs</h3>
        <p className="text-muted-foreground mb-4">Record decon activities after a spill or exposure.</p>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record Decon
        </Button>
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
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-semibold">Decontamination Logs</h3>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record Decon
        </Button>
      </div>

      <div className="space-y-3">
        {data.map((log) => (
          <Card key={log.id} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  {new Date(log.performed_at).toLocaleString()}
                </div>
                <div className="mt-1 font-medium">
                  Incident: {log.incident_id ? log.incident_id.slice(0, 8) : "—"} • Area: {log.vehicle_area || "—"}
                </div>
                {log.notes && <div className="text-sm text-muted-foreground mt-1">{log.notes}</div>}
              </div>
              <Badge variant="secondary">{log.ppe_used ? "PPE used" : "No PPE noted"}</Badge>
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
