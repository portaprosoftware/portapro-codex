
import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Shield } from "lucide-react";

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
    }
  });

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No decontamination logs</h3>
        <p className="text-muted-foreground">Record decon activities after a spill or exposure.</p>
      </Card>
    );
  }

  return (
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
  );
};
