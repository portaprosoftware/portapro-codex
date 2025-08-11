import { useUser } from "@clerk/clerk-react";
import { UserRole } from "@/types";

export const useUserRole = () => {
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata?.role as UserRole) || null;

  const isAdmin = role === "admin";
  const isDispatch = role === "dispatch";
  const isDriver = role === "driver";

  // Admin level access (admin + dispatch)
  const hasAdminAccess = isAdmin || isDispatch;

  // Staff level access (admin + dispatch + driver)
  const hasStaffAccess = isAdmin || isDispatch || isDriver;

  return {
    role,
    isOwner: isAdmin, // Keep for backward compatibility
    isAdmin,
    isDispatch,
    isDriver,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded,
  };
};