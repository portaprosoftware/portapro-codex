
import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { PackageOpen, Plus, Settings, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { EnhancedSpillKitCheckForm } from "./EnhancedSpillKitCheckForm";
import { SpillKitTemplateManager } from "./SpillKitTemplateManager";
import { SpillKitComplianceReports } from "./SpillKitComplianceReports";
import { SpillKitNotificationManager } from "./SpillKitNotificationManager";
import { RestockRequestManager } from "./RestockRequestManager";

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
  const [activeTab, setActiveTab] = useState("overview");

  // Enhanced spill kit status query
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

  // Overdue checks query
  const { data: overdueChecks } = useQuery({
    queryKey: ["overdue-spill-kit-checks"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_overdue_spill_kit_checks');
      if (error) throw error;
      return data || [];
    }
  });

  const rows = useMemo(() => data ?? [], [data]);
  const overdueRows = useMemo(() => overdueChecks ?? [], [overdueChecks]);

  // Statistics
  const stats = useMemo(() => {
    const total = rows.length;
    const compliant = rows.filter(r => r.hasSpillKit).length;
    const overdue = overdueRows.length;
    const recentChecks = rows.filter(r => {
      if (!r.last_checked) return false;
      const daysSince = Math.floor((Date.now() - r.last_checked.getTime()) / (1000 * 60 * 60 * 24));
      return daysSince <= 7;
    }).length;

    return {
      total,
      compliant,
      nonCompliant: total - compliant,
      overdue,
      recentChecks,
      complianceRate: total > 0 ? Math.round((compliant / total) * 100) : 0
    };
  }, [rows, overdueRows]);

  const handleSaved = () => {
    qc.invalidateQueries({ queryKey: ["spill-kits-status"] });
    qc.invalidateQueries({ queryKey: ["overdue-spill-kit-checks"] });
    setDrawerOpen(false);
  };

  if (isLoading) return <div className="py-10 text-center">Loading...</div>;

  if (!rows || rows.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Spill Kit Compliance</h2>
            <p className="text-muted-foreground">Enhanced DOT/OSHA compliant spill kit management</p>
          </div>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> New Inspection
          </Button>
        </div>
        
        <Card className="p-8 text-center">
          <PackageOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No spill kit data found</h3>
          <p className="text-muted-foreground mb-4">Start by conducting your first enhanced spill kit inspection.</p>
          <Button onClick={() => setDrawerOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Start First Inspection
          </Button>
        </Card>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerContent className="h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Enhanced Spill Kit Inspection</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 overflow-y-auto flex-1">
              <EnhancedSpillKitCheckForm 
                onSaved={handleSaved} 
                onCancel={() => setDrawerOpen(false)} 
              />
            </div>
          </DrawerContent>
        </Drawer>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex items-center justify-between">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="restock">Restock Requests</TabsTrigger>
        </TabsList>
        <Button onClick={() => setDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Inspection
        </Button>
      </div>

      <TabsContent value="overview" className="space-y-6">
        {/* Compliance Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Compliance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.complianceRate}%</div>
              <p className="text-xs text-muted-foreground">
                {stats.compliant} of {stats.total} vehicles compliant
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                Overdue Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Recent Checks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.recentChecks}</div>
              <p className="text-xs text-muted-foreground">
                In the last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <PackageOpen className="w-4 h-4 text-purple-600" />
                Non-Compliant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.nonCompliant}</div>
              <p className="text-xs text-muted-foreground">
                Missing spill kits
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overdue Vehicles Section */}
        {overdueRows.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                Overdue Inspections ({overdueRows.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {overdueRows.map((row: any) => (
                  <Card key={row.vehicle_id} className="border-red-200 bg-red-50">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="font-medium">{row.license_plate}</div>
                          <div className="text-sm text-muted-foreground">
                            {row.days_overdue > 0 ? `${row.days_overdue} days overdue` : 'Never checked'}
                          </div>
                        </div>
                        <Badge variant="destructive">Overdue</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Vehicles Status */}
        <Card>
          <CardHeader>
            <CardTitle>All Vehicles Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {rows.map((row) => (
                <Card key={row.vehicle_id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{row.license_plate}</div>
                      <div className="text-sm text-muted-foreground">
                        Last check: {row.last_checked ? row.last_checked.toLocaleDateString() : "Never"}
                      </div>
                    </div>
                    <Badge variant={row.hasSpillKit ? "secondary" : "destructive"}>
                      {row.hasSpillKit ? "Compliant" : "Missing Kit"}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="templates">
        <SpillKitTemplateManager />
      </TabsContent>

      <TabsContent value="reports">
        <SpillKitComplianceReports />
      </TabsContent>

      <TabsContent value="notifications">
        <SpillKitNotificationManager />
      </TabsContent>

      <TabsContent value="restock">
        <RestockRequestManager />
      </TabsContent>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Enhanced Spill Kit Inspection</DrawerTitle>
          </DrawerHeader>
          <div className="p-4 overflow-y-auto flex-1">
            <EnhancedSpillKitCheckForm 
              onSaved={handleSaved} 
              onCancel={() => setDrawerOpen(false)} 
            />
          </div>
        </DrawerContent>
      </Drawer>
    </Tabs>
  );
};
