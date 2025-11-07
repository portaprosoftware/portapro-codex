
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationId } from "@/hooks/useOrganizationId";
import { safeInsert } from "@/lib/supabase-helpers";

export interface CertificationType {
  id: string;
  name: string;
  category?: string | null;
  description?: string | null;
  valid_months?: number | null;
  is_mandatory: boolean;
}

export interface EmployeeCertification {
  id: string;
  driver_clerk_id: string;
  certification_type_id: string;
  completed_on: string; // YYYY-MM-DD
  expires_on?: string | null;
  certificate_url?: string | null;
  notes?: string | null;
}

export function useCertificationTypes() {
  const { orgId } = useOrganizationId();
  
  return useQuery<CertificationType[]>({
    queryKey: ["certification-types", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from("certification_types")
        .select("*")
        .eq('organization_id', orgId)
        .order("name", { ascending: true });
      if (error) throw error;
      return (data || []) as CertificationType[];
    },
    enabled: !!orgId,
  });
}

export function useCreateCertificationType() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useOrganizationId();
  
  return useMutation({
    mutationFn: async (payload: Omit<CertificationType, "id">) => {
      if (!orgId) {
        throw new Error('Organization context required for multi-tenant data isolation');
      }
      
      const { error } = await safeInsert(
        "certification_types",
        payload,
        orgId
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["certification-types"] });
      toast({ title: "Certification type created" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to create type", description: e.message, variant: "destructive" });
    },
  });
}

export function useEmployeeCertifications() {
  const { orgId } = useOrganizationId();
  
  return useQuery<EmployeeCertification[]>({
    queryKey: ["employee-certifications", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from("employee_certifications")
        .select("*")
        .eq('organization_id', orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as EmployeeCertification[];
    },
    enabled: !!orgId,
  });
}

export function useAddEmployeeCertification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useOrganizationId();
  
  return useMutation({
    mutationFn: async (payload: Omit<EmployeeCertification, "id">) => {
      if (!orgId) {
        throw new Error('Organization context required for multi-tenant data isolation');
      }
      
      const { error } = await safeInsert(
        "employee_certifications",
        payload,
        orgId
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-certifications"] });
      toast({ title: "Certification added" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to add certification", description: e.message, variant: "destructive" });
    },
  });
}

export function useUpdateEmployeeCertification() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (args: { id: string; certificate_url?: string | null; expires_on?: string | null; notes?: string | null }) => {
      const { error } = await supabase
        .from("employee_certifications")
        .update({
          certificate_url: args.certificate_url ?? undefined,
          expires_on: args.expires_on ?? undefined,
          notes: args.notes ?? undefined,
        } as any)
        .eq("id", args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employee-certifications"] });
      toast({ title: "Certification updated" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update certification", description: e.message, variant: "destructive" });
    },
  });
}

export function useTrainingRequirements() {
  const { orgId } = useOrganizationId();
  
  return useQuery<any[]>({
    queryKey: ["training-requirements", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from("training_requirements")
        .select("*")
        .eq('organization_id', orgId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
  });
}

export function useCreateTrainingRequirement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { orgId } = useOrganizationId();
  
  return useMutation({
    mutationFn: async (payload: { role: string; certification_type_id: string; is_required?: boolean; frequency_months?: number | null; }) => {
      if (!orgId) {
        throw new Error('Organization context required for multi-tenant data isolation');
      }
      
      const { error } = await safeInsert(
        "training_requirements",
        payload,
        orgId
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-requirements"] });
      toast({ title: "Requirement saved" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to save requirement", description: e.message, variant: "destructive" });
    },
  });
}

export function useDeleteTrainingRequirement() {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("training_requirements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-requirements"] });
      toast({ title: "Requirement deleted" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to delete requirement", description: e.message, variant: "destructive" });
    },
  });
}
