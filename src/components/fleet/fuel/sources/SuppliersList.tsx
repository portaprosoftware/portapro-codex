import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Mail, Phone, DollarSign, FileText, Eye, Pencil, Trash2 } from 'lucide-react';
import { useFuelSuppliers } from '@/hooks/useFuelSuppliers';
import { FuelSupplier } from '@/types/fuel';
import { ViewSupplierModal } from './ViewSupplierModal';
import { EditSupplierModal } from './EditSupplierModal';
import { DeleteSupplierModal } from './DeleteSupplierModal';

export const SuppliersList: React.FC = () => {
  const { data: suppliers, isLoading } = useFuelSuppliers();
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<FuelSupplier | null>(null);

  const handleView = (supplier: FuelSupplier) => {
    setSelectedSupplier(supplier);
    setViewModalOpen(true);
  };

  const handleEdit = (supplier: FuelSupplier) => {
    setSelectedSupplier(supplier);
    setEditModalOpen(true);
  };

  const handleDelete = (supplier: FuelSupplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalOpen(true);
  };

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading suppliers...</div>;
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            No suppliers created yet. Click "Add Supplier" to get started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {suppliers.map((supplier) => (
        <Card key={supplier.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">{supplier.supplier_name}</CardTitle>
              </div>
              <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-bold">
                Active
              </Badge>
            </div>
            {supplier.contact_name && (
              <CardDescription className="text-sm">{supplier.contact_name}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {supplier.contact_email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{supplier.contact_email}</span>
              </div>
            )}
            {supplier.contact_phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">{supplier.contact_phone}</span>
              </div>
            )}
            {supplier.payment_terms && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span className="text-foreground">Payment: {supplier.payment_terms}</span>
              </div>
            )}
            {supplier.notes && (
              <div className="flex items-start gap-2 text-sm pt-2 border-t">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground line-clamp-2">{supplier.notes}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-3 border-t mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(supplier)}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(supplier)}
                className="flex-1"
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(supplier)}
                className="flex-1 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <ViewSupplierModal
        isOpen={viewModalOpen}
        onClose={() => setViewModalOpen(false)}
        supplier={selectedSupplier}
      />
      <EditSupplierModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        supplier={selectedSupplier}
      />
      <DeleteSupplierModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        supplier={selectedSupplier}
      />
    </div>
  );
};
