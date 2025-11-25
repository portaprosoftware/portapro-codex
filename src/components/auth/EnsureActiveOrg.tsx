import React, { useEffect, useState } from 'react';
import { useOrganization, useOrganizationList } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';
import { useOrganizationContext } from '@/contexts/OrganizationContext';

interface EnsureActiveOrgProps {
  children: React.ReactNode;
}

export const EnsureActiveOrg: React.FC<EnsureActiveOrgProps> = ({ children }) => {
  const { organization: tenantOrg, isLoading, isLocalhost, isMainDomain } = useOrganizationContext();
  const { organization: clerkOrg, isLoaded: clerkLoaded } = useOrganization();
  const { setActive, isLoaded: orgListLoaded } = useOrganizationList();
  const [isActivating, setIsActivating] = useState(false);

  const shouldEnforceTenant = !!tenantOrg && !isLocalhost && !isMainDomain;
  const isActiveMismatch =
    shouldEnforceTenant && clerkOrg?.id && tenantOrg?.clerk_org_id && clerkOrg.id !== tenantOrg.clerk_org_id;

  useEffect(() => {
    if (!shouldEnforceTenant || !orgListLoaded || !clerkLoaded || isActivating) return;
    if (!tenantOrg?.clerk_org_id) return;

    const activate = async () => {
      try {
        setIsActivating(true);
        await setActive({ organization: tenantOrg.clerk_org_id });
      } finally {
        setIsActivating(false);
      }
    };

    if (!clerkOrg || isActiveMismatch) {
      activate();
    }
  }, [shouldEnforceTenant, orgListLoaded, clerkLoaded, tenantOrg, clerkOrg, isActivating, setActive, isActiveMismatch]);

  if (isLoading || isActivating || !orgListLoaded || !clerkLoaded || isActiveMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Preparing your workspace...</p>
        </div>
      </div>
    );
  }

  if (!shouldEnforceTenant) {
    return <>{children}</>;
  }

  return <>{children}</>;
};
