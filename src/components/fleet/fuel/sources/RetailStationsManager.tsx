import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AddFuelLogModal } from '../AddFuelLogModal';
import { FuelSettingsTab } from '../FuelSettingsTab';

export const RetailStationsManager: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold">Retail Fuel Pump Purchases</h3>
        </div>
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary to-primary-variant"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Retail Fuel Log
        </Button>
      </div>
      
      <FuelSettingsTab />
      
      <AddFuelLogModal open={showAddModal} onOpenChange={setShowAddModal} />
    </div>
  );
};
