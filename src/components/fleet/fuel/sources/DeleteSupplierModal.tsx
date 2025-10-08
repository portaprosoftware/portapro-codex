import React from 'react';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { FuelSupplier } from '@/types/fuel';
import { useDeleteFuelSupplier } from '@/hooks/useFuelSuppliers';

interface DeleteSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: FuelSupplier | null;
}

export const DeleteSupplierModal: React.FC<DeleteSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  const deleteSupplier = useDeleteFuelSupplier();

  const handleConfirm = async () => {
    if (!supplier) return;
    await deleteSupplier.mutateAsync(supplier.id);
  };

  if (!supplier) return null;

  return (
    <DeleteConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Supplier"
      description={`Are you sure you want to delete "${supplier.supplier_name}"? This action will deactivate the supplier.`}
      confirmText="Delete Supplier"
      isDestructive={true}
    />
  );
};
