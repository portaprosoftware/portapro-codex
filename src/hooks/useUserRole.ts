import { useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UserRole } from "@/types";

export const useUserRole = () => {
  const { user, isLoaded } = useUser();

  const { data: roleData, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('clerk_user_id', user.id)
        .maybeSingle();
      
      return data?.role as UserRole || null;
    },
    enabled: !!user?.id && isLoaded,
  });

  const role = roleData;
  const isAdmin = role === "admin";
  const isDispatcher = role === "dispatcher";
  const isDriver = role === "driver";

  // Admin level access (admin + dispatcher)
  const hasAdminAccess = isAdmin || isDispatcher;

  // Staff level access (admin + dispatcher + driver)
  const hasStaffAccess = isAdmin || isDispatcher || isDriver;

  return {
    role,
    isOwner: isAdmin, // Keep for backward compatibility
    isAdmin,
    isDispatcher,
    isDriver,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded: isLoaded && !roleLoading,
  };
};