import React from 'react';
import { Card } from '@/components/ui/card';
import { Building2 } from 'lucide-react';
import { FuelSettingsTab } from '../FuelSettingsTab';

export const RetailStationsManager: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <Building2 className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold">Retail Fuel Stations</h4>
            <p className="text-sm text-muted-foreground">
              Manage frequently used gas stations for retail fuel purchases
            </p>
          </div>
        </div>
        
        <FuelSettingsTab />
      </Card>
    </div>
  );
};
