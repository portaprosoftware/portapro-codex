import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useOrganizationId } from "@/hooks/useOrganizationId";

// Directory helpers for drivers (profiles joined with user_roles = 'driver')
export function useDriverDirectory() {
  const { orgId } = useOrganizationId();

  return useQuery({
    queryKey: ["driver-directory", orgId],
    queryFn: async () => {
      if (!orgId) throw new Error('Organization ID required');

      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, clerk_user_id, organization_id, user_roles!inner(role)")
        .eq("organization_id", orgId)
        .eq("user_roles.role", "org:driver" as any);
      if (error) throw error;
      // Ensure a consistent shape
      return (data || []).map((d: any) => ({
        id: d.id as string,
        first_name: d.first_name as string | null,
        last_name: d.last_name as string | null,
        email: d.email as string | null,
        clerk_user_id: d.clerk_user_id as string | null,
        organization_id: d.organization_id as string | null,
      }));
    },
    enabled: !!orgId,
  });
}
