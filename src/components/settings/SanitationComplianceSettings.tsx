import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CompanySettings {
  id: string;
  enable_sanitation_compliance: boolean;
}

interface Checklist {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  is_active: boolean;
}

export const SanitationComplianceSettings: React.FC = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [creating, setCreating] = useState(false);

  // Fetch settings and checklists
  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      setLoading(true);
      const [{ data: settingsRow, error: settingsError }, { data: checklistRows, error: clError }] = await Promise.all([
        supabase.from("company_settings").select("id, enable_sanitation_compliance").limit(1).maybeSingle(),
        supabase.from("sanitation_checklists").select("id, name, description, region, is_active").order("created_at", { ascending: true }),
      ]);

      if (!active) return;

      if (settingsError) {
        toast({ title: "Failed to load settings", description: settingsError.message, variant: "destructive" });
      } else if (settingsRow) {
        setCompanySettings(settingsRow as CompanySettings);
      }

      if (clError) {
        toast({ title: "Failed to load checklists", description: clError.message, variant: "destructive" });
      } else {
        setChecklists((checklistRows || []) as Checklist[]);
      }
      setLoading(false);
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [toast]);

  const handleToggle = async (enabled: boolean) => {
    if (!companySettings) return;
    setSaving(true);
    const { error } = await supabase
      .from("company_settings")
      .update({ enable_sanitation_compliance: enabled, updated_at: new Date().toISOString() })
      .eq("id", companySettings.id);

    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    setCompanySettings({ ...companySettings, enable_sanitation_compliance: enabled });
    toast({ title: "Saved", description: `Sanitation compliance ${enabled ? "enabled" : "disabled"}.` });
  };

  const createDefaultChecklist = async () => {
    setCreating(true);
    try {
      // Check if default exists
      const { data: existing } = await supabase
        .from("sanitation_checklists")
        .select("id")
        .eq("name", "Default Sanitation Checklist")
        .maybeSingle();

      let checklistId = existing?.id as string | undefined;

      if (!checklistId) {
        const { data: inserted, error: insertErr } = await supabase
          .from("sanitation_checklists")
          .insert({ name: "Default Sanitation Checklist", description: "Standard sanitation requirements", is_active: true })
          .select("id")
          .single();
        if (insertErr) throw insertErr;
        checklistId = inserted.id;
      }

      // Seed default items (upsert by unique key)
      const defaultItems = [
        { item_key: "sanitized_with_approved_chemicals", label: "Unit sanitized with approved chemicals", required: true, sort_order: 1 },
        { item_key: "toilet_paper_stocked", label: "Toilet paper stocked (min. 2 rolls)", required: true, sort_order: 2 },
        { item_key: "hand_sanitizer_refilled", label: "Hand sanitizer refilled (if applicable)", required: false, sort_order: 3 },
        { item_key: "ventilation_clear", label: "Ventilation clear", required: true, sort_order: 4 },
        { item_key: "no_visible_biohazards", label: "No visible biohazards", required: true, sort_order: 5 },
      ];

      for (const item of defaultItems) {
        const { error: upsertErr } = await supabase.from("sanitation_checklist_items").upsert(
          { checklist_id: checklistId, ...item },
          { onConflict: "checklist_id,item_key" }
        );
        if (upsertErr) throw upsertErr;
      }

      toast({ title: "Default checklist ready", description: "You can edit items anytime." });

      // Refresh list
      const { data: clRows } = await supabase
        .from("sanitation_checklists")
        .select("id, name, description, region, is_active")
        .order("created_at", { ascending: true });
      setChecklists((clRows || []) as Checklist[]);
    } catch (e: any) {
      toast({ title: "Failed to create checklist", description: e.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sanitation & Compliance</CardTitle>
          <CardDescription>Enable sanitation tracking and manage default checklists.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Sanitation Compliance</p>
              <p className="text-sm text-muted-foreground">Adds sanitation fields to service flows and unlocks compliance reporting.</p>
            </div>
            <Switch
              disabled={loading || saving || !companySettings}
              checked={!!companySettings?.enable_sanitation_compliance}
              onCheckedChange={handleToggle}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Checklists</CardTitle>
          <CardDescription>Use the default checklist or create specialized ones later.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={createDefaultChecklist} disabled={creating}>
              {creating ? "Creating..." : "Create Default Sanitation Checklist"}
            </Button>
          </div>

          <div className="mt-6 divide-y rounded-md border">
            <div className="grid grid-cols-3 gap-2 px-4 py-2 text-sm font-medium">
              <span>Name</span>
              <span>Status</span>
              <span>Region</span>
            </div>
            {checklists.length === 0 && (
              <div className="px-4 py-6 text-sm text-muted-foreground">No checklists yet.</div>
            )}
            {checklists.map((c) => (
              <div key={c.id} className="grid grid-cols-3 gap-2 px-4 py-3 text-sm">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted-foreground">{c.is_active ? "Active" : "Inactive"}</span>
                <span className="text-muted-foreground">{c.region || "—"}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
