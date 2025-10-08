import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, Mail, Phone, DollarSign, FileText, MoreVertical, Eye, Pencil, Trash2 } from 'lucide-react';
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
    <div className="space-y-2">
      {suppliers.map((supplier) => (
        <Card key={supplier.id}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-foreground truncate">{supplier.supplier_name}</h4>
                    <Badge variant="outline" className="bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-bold flex-shrink-0">
                      Active
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {supplier.contact_name && (
                      <span className="truncate">{supplier.contact_name}</span>
                    )}
                    {supplier.contact_phone && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <Phone className="h-3 w-3" />
                        {supplier.contact_phone}
                      </span>
                    )}
                    {supplier.payment_terms && (
                      <span className="flex items-center gap-1 flex-shrink-0">
                        <DollarSign className="h-3 w-3" />
                        {supplier.payment_terms}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleView(supplier)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleEdit(supplier)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDelete(supplier)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
