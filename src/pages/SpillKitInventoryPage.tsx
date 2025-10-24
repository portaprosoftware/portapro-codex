import React, { useEffect } from 'react';
import { FleetLayout } from '@/components/fleet/FleetLayout';
import { SpillKitInventoryManager } from '@/components/fleet/compliance/SpillKitInventoryManager';

export default function SpillKitInventoryPage() {
  return (
    <FleetLayout>
      <SpillKitInventoryManager />
    </FleetLayout>
  );
}
