import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download } from 'lucide-react';
import { AddFuelLogModal } from './AddFuelLogModal';
import { ExportFuelDataModal } from './ExportFuelDataModal';

export const FuelLogsActions: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button 
          onClick={() => setShowAddModal(true)}
          className="bg-gradient-to-r from-primary to-primary-variant"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Retail Fuel Log
        </Button>
        <Button 
          onClick={() => setShowExportModal(true)}
          variant="outline"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>

      <AddFuelLogModal open={showAddModal} onOpenChange={setShowAddModal} />
      <ExportFuelDataModal open={showExportModal} onOpenChange={setShowExportModal} />
    </>
  );
};
