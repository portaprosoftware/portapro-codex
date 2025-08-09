import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, MapPin } from "lucide-react";

export const IncidentsTab: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["spill-incidents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("spill_incident_reports")
        .select("id, incident_date, vehicle_id, location_description, immediate_action_taken")
        .order("incident_date", { ascending: false });
      if (error) throw error;
      return data ?? [];
    }
  });

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No spill incidents recorded</h3>
        <p className="text-muted-foreground">When incidents are logged, they’ll show up here.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((inc: any) => (
        <Card key={inc.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                {new Date(inc.incident_date).toLocaleString()}
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
  );
};