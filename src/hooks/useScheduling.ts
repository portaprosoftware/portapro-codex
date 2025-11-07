import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { startOfWeek, endOfWeek, format } from "date-fns";
import { triggerRouteScheduleChangeNotification } from "@/utils/notificationTriggers";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { safeInsert } from "@/lib/supabase-helpers";

export interface ShiftTemplate {
  id: string;
  name: string;
  shift_type: string;
  description?: string | null;
  start_time: string; // HH:mm:ss
  end_time: string;   // HH:mm:ss
  color?: string | null;
}

export interface DriverShift {
  id: string;
  driver_clerk_id: string;
  shift_date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  template_id?: string | null;
}

export function useShiftTemplates() {
  const { orgId } = useOrganizationId();
  
  return useQuery<ShiftTemplate[]>({
    queryKey: ["shift-templates", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from("shift_templates")
        .select("*")
        .eq('organization_id', orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ShiftTemplate[];
    },
    enabled: !!orgId,
  });
}

export function useCreateShiftTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useOrganizationId();
  
  return useMutation({
    mutationFn: async (payload: Omit<ShiftTemplate, "id">) => {
      if (!orgId) {
        throw new Error('Organization context required for multi-tenant data isolation');
      }
      
      const { error } = await safeInsert(
        "shift_templates",
        payload,
        orgId
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-templates"] });
      toast({ title: "Template created" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to create template", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteShiftTemplate() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("shift_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["shift-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to delete template", description: e.message, variant: "destructive" });
    },
  });
}

export function useDriverShiftsForWeek(anchorDate: Date) {
  const { orgId } = useOrganizationId();
  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 0 });
  const from = format(weekStart, "yyyy-MM-dd");
  const to = format(weekEnd, "yyyy-MM-dd");
  
  return useQuery<DriverShift[]>({
    queryKey: ["driver-shifts", orgId, from, to],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from("driver_shifts")
        .select("*")
        .eq('organization_id', orgId)
        .gte("shift_date", from)
        .lte("shift_date", to)
        .order("shift_date", { ascending: true });
      if (error) throw error;
      return (data || []) as DriverShift[];
    },
    enabled: !!orgId,
  });
}

export function useAssignShift() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useOrganizationId();
  
  return useMutation({
    mutationFn: async (args: { driver_clerk_id: string; date: string; template_id?: string }) => {
      if (!orgId) {
        throw new Error('Organization context required for multi-tenant data isolation');
      }
      
      let start_time = "08:00:00";
      let end_time = "16:00:00";
      if (args.template_id) {
        const { data: tpl, error: tplErr } = await (supabase as any)
          .from("shift_templates")
          .select("start_time,end_time")
          .eq("id", args.template_id)
          .eq('organization_id', orgId)
          .maybeSingle();
        if (tplErr) throw tplErr;
        if (tpl) {
          start_time = (tpl as any).start_time;
          end_time = (tpl as any).end_time;
        }
      }
      const { error } = await safeInsert(
        "driver_shifts",
        {
          driver_clerk_id: args.driver_clerk_id,
          shift_date: args.date,
          start_time,
          end_time,
          status: "scheduled",
          template_id: args.template_id || null,
        },
        orgId
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-shifts"] });
      toast({ title: "Shift assigned" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to assign shift", description: e.message, variant: "destructive" });
    },
  });
}

export function useMoveShift() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (args: { shift_id: string; new_date?: string; new_driver_clerk_id?: string }) => {
      const update: any = {};
      if (args.new_date) update.shift_date = args.new_date;
      if (args.new_driver_clerk_id) update.driver_clerk_id = args.new_driver_clerk_id;
      const { error } = await supabase.from("driver_shifts").update(update).eq("id", args.shift_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["driver-shifts"] });
      toast({ title: "Shift updated" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update shift", description: e.message, variant: "destructive" });
    },
  });
}
