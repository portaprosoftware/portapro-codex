import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Directory helpers for drivers (profiles joined with user_roles = 'driver')
export function useDriverDirectory() {
  return useQuery({
    queryKey: ["driver-directory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, first_name, last_name, email, clerk_user_id, user_roles!inner(role)")
        .eq("user_roles.role", "driver");
      if (error) throw error;
      // Ensure a consistent shape
      return (data || []).map((d: any) => ({
        id: d.id as string,
        first_name: d.first_name as string | null,
        last_name: d.last_name as string | null,
        email: d.email as string | null,
        clerk_user_id: d.clerk_user_id as string | null,
      }));
    },
  });
}
