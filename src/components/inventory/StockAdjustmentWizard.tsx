
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
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const StockAdjustmentWizard: React.FC<StockAdjustmentWizardProps> = ({
  productId,
  productName,
  currentStock,
  onComplete,
  onCancel,
  isOpen,
  onOpenChange
}) => {
  const [localIsOpen, setLocalIsOpen] = useState(false);
  
  // Use passed props if available, otherwise use local state
  const finalIsOpen = isOpen !== undefined ? isOpen : localIsOpen;
  const finalOnOpenChange = onOpenChange || setLocalIsOpen;

  return (
    <TrackedOperationsPanel
      productId={productId}
      productName={productName}
      isOpen={finalIsOpen}
      onOpenChange={finalOnOpenChange}
      trigger={null}
      onClose={() => {
        finalOnOpenChange(false);
        onComplete?.();
        onCancel?.();
      }}
    />
  );
};
