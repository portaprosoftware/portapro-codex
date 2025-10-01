import React from 'react';
import { SpillKitRoleGateway } from './SpillKitRoleGateway';

interface SpillKitsTabProps {
  inspectionDrawerOpen?: boolean;
  setInspectionDrawerOpen?: (open: boolean) => void;
}

export function SpillKitsTab({ inspectionDrawerOpen, setInspectionDrawerOpen }: SpillKitsTabProps) {
  return (
    <SpillKitRoleGateway 
      inspectionDrawerOpen={inspectionDrawerOpen}
      setInspectionDrawerOpen={setInspectionDrawerOpen}
    />
  );
}