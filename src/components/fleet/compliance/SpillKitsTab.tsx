
import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PackageOpen, Plus } from "lucide-react";
import { SpillKitCheckForm } from "./SpillKitCheckForm";

type DVIR = {
  id: string;
  asset_id: string;
  submitted_at: string | null;
  items: any;
};

type SpillKitRow = {
  vehicle_id: string;
  license_plate: string;
  hasSpillKit: boolean;
  last_checked: Date | null;
};

export const SpillKitsTab: React.FC = () => {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["spill-kits-status"],
    queryFn: async () => {
      // 1) Prefer new vehicle_spill_kit_checks (latest per vehicle)
      const { data: checks, error: cErr } = await supabase
        .from("vehicle_spill_kit_checks")
        .select("vehicle_id, has_kit, contents, notes, checked_at")
        .order("checked_at", { ascending: false })
        .limit(500);
      if (cErr) throw cErr;

      const vehicleIds = Array.from(new Set((checks ?? []).map((c: any) => c.vehicle_id)));
      // 2) Fallback to DVIR for vehicles not found above
      const { data: reports, error: rErr } = await supabase
        .from("dvir_reports")
        .select("id, asset_type, asset_id, submitted_at, items")
        .eq("asset_type", "vehicle")
        .order("submitted_at", { ascending: false })
        .limit(200);
      if (rErr) throw rErr;

      // Vehicles lookup
      const { data: vehicles, error: vErr } = await supabase
        .from("vehicles")
        .select("id, license_plate");
      if (vErr) throw vErr;

      const plateById = new Map((vehicles ?? []).map((v: any) => [v.id, v.license_plate]));

      // Build summary preferring checks
      const latestByVehicle = new Map<string, SpillKitRow>();

      for (const c of checks ?? []) {
        if (!latestByVehicle.has(c.vehicle_id)) {
          latestByVehicle.set(c.vehicle_id, {
            vehicle_id: c.vehicle_id,
            license_plate: plateById.get(c.vehicle_id) || c.vehicle_id,
            hasSpillKit: Boolean(c.has_kit),
            last_checked: c.checked_at ? new Date(c.checked_at) : null,
          });
        }
      }

      // Fallback to DVIR for others
      const seen = new Set(latestByVehicle.keys());
      for (const r of reports ?? []) {
        if (!r.asset_id || seen.has(r.asset_id)) continue;
        const items = (r as DVIR).items || {};
        const hasSpillKit = Boolean(items["spill_kit_present"] ?? items["spill_kit_available"]);
        latestByVehicle.set(r.asset_id, {
          vehicle_id: r.asset_id,
          license_plate: plateById.get(r.asset_id) || r.asset_id,
          hasSpillKit,
          last_checked: r.submitted_at ? new Date(r.submitted_at) : null,
        });
      }

      return Array.from(latestByVehicle.values());
    }
  });

  const rows = useMemo(() => data ?? [], [data]);

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["spill-kits-status"] });
    setDrawerOpen(false);
  };

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!rows || rows.length === 0) {
    return (
      <Card className="p-8 text-center">
        <PackageOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium">No DVIR or spill kit checks found</h3>
        <p className="text-muted-foreground mb-4">Once drivers or dispatch record checks, status will appear here.</p>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record Spill Kit Check
        </Button>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[75vh]">
            <DrawerHeader>
              <DrawerTitle>Record Spill Kit Check</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto flex-1">
              <SpillKitCheckForm 
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
        <h3 className="text-base font-semibold">Spill Kit Status</h3>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Record Spill Kit Check
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {rows.map((row) => (
          <Card key={row.vehicle_id} className="p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">
                {row.last_checked ? row.last_checked.toLocaleDateString() : "—"}
              </div>
              <div className="font-medium">{row.license_plate}</div>
            </div>
            <Badge variant={row.hasSpillKit ? "secondary" : "destructive"}>
              {row.hasSpillKit ? "Spill kit present" : "Missing spill kit"}
            </Badge>
          </Card>
        ))}
      </div>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[75vh]">
          <DrawerHeader>
            <DrawerTitle>Record Spill Kit Check</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            <SpillKitCheckForm 
              onSaved={handleSaved} 
              onCancel={() => setDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};
