import { useUser } from "@clerk/clerk-react";
import { UserRole } from "@/types";
import { useState, useEffect } from "react";

export const useUserRole = () => {
  const [isReady, setIsReady] = useState(false);
  
  // Ensure React context is available before using Clerk hooks
  useEffect(() => {
    setIsReady(true);
  }, []);
  
  // Return safe defaults if React context isn't ready
  if (!isReady) {
    return {
      role: null,
      isOwner: false,
      isDispatch: false,
      isDriver: false,
      isCustomer: false,
      hasAdminAccess: false,
      hasStaffAccess: false,
      user: null,
      isLoaded: false
    };
  }
  
  let user, isLoaded;
  try {
    const clerkData = useUser();
    user = clerkData.user;
    isLoaded = clerkData.isLoaded;
  } catch (error) {
    // Fallback if Clerk context isn't available
    return {
      role: null,
      isOwner: false,
      isDispatch: false,
      isDriver: false,
      isCustomer: false,
      hasAdminAccess: false,
      hasStaffAccess: false,
      user: null,
      isLoaded: false
    };
  }
  
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
    isLoaded
  };
};