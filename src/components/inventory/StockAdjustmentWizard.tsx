
import React, { useState } from 'react';
import { TrackedOperationsPanel } from './TrackedOperationsPanel';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

interface StockAdjustmentWizardProps {
  productId: string;
  productName: string;
  currentStock: number;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const StockAdjustmentWizard: React.FC<StockAdjustmentWizardProps> = ({
  productId,
  productName,
  currentStock,
  onComplete,
  onCancel
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <TrackedOperationsPanel
      productId={productId}
      productName={productName}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          <Settings className="w-4 h-4 mr-2" />
          Adjust Stock
        </Button>
      }
      onClose={() => {
        setIsOpen(false);
        onComplete?.();
        onCancel?.();
      }}
    />
  );
};
