import React from 'react';
import { SpillKitHistory } from './SpillKitHistory';

interface SpillKitsTabProps {
  inspectionDrawerOpen?: boolean;
  setInspectionDrawerOpen?: (open: boolean) => void;
}

export function SpillKitsTab({ inspectionDrawerOpen, setInspectionDrawerOpen }: SpillKitsTabProps) {
  return (
    <SpillKitHistory />
  );
}