import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageOpen } from "lucide-react";

type DVIR = {
  id: string;
  asset_id: string;
  submitted_at: string | null;
  items: any;
};

export const SpillKitsTab: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["spill-kits-status"],
    queryFn: async () => {
      const { data: reports, error: rErr } = await supabase
        .from("dvir_reports")
        .select("id, asset_type, asset_id, submitted_at, items")
        .eq("asset_type", "vehicle")
        .order("submitted_at", { ascending: false })
        .limit(200);
      if (rErr) throw rErr;

      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select("id, license_plate");
      if (vErr) throw vErr;

      const plateById = new Map((vehicles ?? []).map((v: any) => [v.id, v.license_plate]));

      const seen = new Set<string>();
      const summary: Array<{ vehicle_id: string; license_plate: string; hasSpillKit: boolean; last_checked: Date | null; }> = [];
      for (const r of reports ?? []) {
        if (!r.asset_id || seen.has(r.asset_id)) continue;
        const items = (r as DVIR).items || {};
        const hasSpillKit = Boolean(items["spill_kit_present"] ?? items["spill_kit_available"]);
        summary.push({
          vehicle_id: r.asset_id,
          license_plate: plateById.get(r.asset_id) || r.asset_id,
          hasSpillKit,
          last_checked: r.submitted_at ? new Date(r.submitted_at) : null,
        });
        seen.add(r.asset_id);
      }
      return summary;
    }
  });

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!data || data.length === 0) {
    return (
      <Card className="p-8 text-center">
        <PackageOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No DVIR checks found</h3>
        <p className="text-muted-foreground">Once drivers submit DVIRs, spill kit status will appear here.</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {data.map((row: any) => (
        <Card key={row.vehicle_id} className="p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-muted-foreground">{row.last_checked ? row.last_checked.toLocaleDateString() : "—"}</div>
            <div className="font-medium">{row.license_plate}</div>
          </div>
          <Badge variant={row.hasSpillKit ? "secondary" : "destructive"}>
            {row.hasSpillKit ? "Spill kit present" : "Missing spill kit"}
          </Badge>
        </Card>
      ))}
    </div>
  );
};