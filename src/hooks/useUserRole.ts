
import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'owner' | 'dispatcher' | 'admin' | 'driver' | 'viewer' | 'unknown';

export function useUserRole() {
  const { user, isLoaded } = useUser();

  // Query the user_roles table to get the actual role from Supabase
  const { data: supabaseRole, isLoading: roleLoading } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      // First get the profile to map clerk_user_id to profile id
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('clerk_user_id', user.id)
        .single();
      
      if (!profile) return null;
      
      // Then get the role from user_roles table
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', profile.id)
        .single();
      
      return roleData?.role as AppRole | null;
    },
    enabled: isLoaded && !!user,
  });

  // Priority: Supabase role > Clerk publicMetadata role > unknown
  const role: AppRole = supabaseRole || (user?.publicMetadata?.role as AppRole) || 'unknown';

  // Log current user info in development for debugging
  const hasLoggedRef = React.useRef(false);
  if (process.env.NODE_ENV === 'development' && isLoaded && !hasLoggedRef.current) {
    console.log('useUserRole - Current user:', {
      userId: user?.id,
      firstName: user?.firstName,
      lastName: user?.lastName,
      clerkRole: user?.publicMetadata?.role,
      supabaseRole,
      finalRole: role,
      isLoaded,
      roleLoading
    });
    hasLoggedRef.current = true;
  }

  const isOwner = role === 'owner';
  const isDispatcher = role === 'dispatcher';
  const isAdmin = role === 'admin';
  const isDriver = role === 'driver';
  
  // REMOVED temporary overrides - now using real role checks
  const canViewCustomerDocs = isOwner || isDispatcher || isAdmin;
  const hasAdminAccess = isOwner || isDispatcher || isAdmin;
  const hasStaffAccess = isOwner || isDispatcher || isAdmin || isDriver;

  return {
    role,
    isOwner,
    isDispatcher,
    isAdmin,
    isDriver,
    canViewCustomerDocs,
    hasAdminAccess,
    hasStaffAccess,
    user,
    isLoaded: isLoaded && !roleLoading,
    userId: user?.id || null,
  };
}
