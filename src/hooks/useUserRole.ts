import { useUser } from "@clerk/clerk-react";
import { UserRole } from "@/types";

export const useUserRole = () => {
  const { user, isLoaded } = useUser();

  const role = (user?.publicMetadata?.role as UserRole) || null;

  const isOwner = role === "owner";
  const isDispatch = role === "dispatch";
  const isDriver = role === "driver";
  const isCustomer = role === "customer";

  // Admin level access (owner + dispatch)
  const hasAdminAccess = isOwner || isDispatch;

  // Staff level access (owner + dispatch + driver)
  const hasStaffAccess = isOwner || isDispatch || isDriver;

  return {
    role,
    isOwner,
    isDispatch,
    isDriver,
    isCustomer,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded,
  };
};