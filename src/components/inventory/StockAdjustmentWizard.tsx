
import React from 'react';
import { StockOperationsPanel } from './StockOperationsPanel';

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
  return (
    <StockOperationsPanel
      productId={productId}
      productName={productName}
      onClose={() => {
        onComplete?.();
        onCancel?.();
      }}
    />
  );
};
