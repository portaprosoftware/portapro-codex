import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSubdomainOrg } from '@/hooks/useSubdomainOrg';

interface OrganizationData {
  id: string;
  clerk_org_id: string;
  name: string;
  subdomain: string;
  is_active: boolean;
}

interface OrganizationContextValue {
  subdomain: string | null;
  organization: OrganizationData | null;
  isLoading: boolean;
  error: Error | null;
  isLocalhost: boolean;
  isMainDomain: boolean;
}

const OrganizationContext = createContext<OrganizationContextValue | undefined>(undefined);

interface OrganizationProviderProps {
  children: React.ReactNode;
}

/**
 * OrganizationProvider - Global provider for subdomain-based organization data
 * 
 * Wraps the entire app and makes organization information available via context.
 * Uses useSubdomainOrg hook internally to extract subdomain and fetch organization data.
 * 
 * Benefits:
 * - Single source of truth for organization data
 * - Avoids duplicate API calls across components
 * - Simplifies component logic
 * 
 * @example
 * // In main.tsx or App.tsx
 * <OrganizationProvider>
 *   <App />
 * </OrganizationProvider>
 */
export const OrganizationProvider: React.FC<OrganizationProviderProps> = ({ children }) => {
  const orgData = useSubdomainOrg();
  const queryClient = useQueryClient();
  const previousOrgId = useRef<string | null>(null);

  useEffect(() => {
    const nextOrgId = orgData.organization?.id || null;

    if (previousOrgId.current && nextOrgId && previousOrgId.current !== nextOrgId) {
      queryClient.clear();
    }

    if (nextOrgId) {
      previousOrgId.current = nextOrgId;
    }
  }, [orgData.organization?.id, queryClient]);

  return (
    <OrganizationContext.Provider value={orgData}>
      {children}
    </OrganizationContext.Provider>
  );
};

/**
 * useOrganizationContext - Hook to consume organization context
 * 
 * Provides access to organization data from any component in the app.
 * Must be used within OrganizationProvider.
 * 
 * @returns {OrganizationContextValue} Organization data, subdomain, loading state, and error
 * 
 * @throws {Error} If used outside of OrganizationProvider
 * 
 * @example
 * const { organization, isLoading } = useOrganizationContext();
 * 
 * if (isLoading) return <Loader />;
 * if (!organization) return <NotFound />;
 * 
 * return <h1>Welcome to {organization.name}</h1>;
 */
export const useOrganizationContext = (): OrganizationContextValue => {
  const context = useContext(OrganizationContext);
  
  if (context === undefined) {
    throw new Error('useOrganizationContext must be used within an OrganizationProvider');
  }
  
  return context;
};
