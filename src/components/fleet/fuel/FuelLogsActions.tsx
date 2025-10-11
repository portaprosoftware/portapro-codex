import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportFuelDataModal } from './ExportFuelDataModal';

export const FuelLogsActions: React.FC = () => {
  const [showExportModal, setShowExportModal] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setShowExportModal(true)}
        variant="outline"
        size="sm"
      >
        <Download className="h-4 w-4 mr-2" />
        Export Data
      </Button>

      <ExportFuelDataModal open={showExportModal} onOpenChange={setShowExportModal} />
    </>
  );
};
