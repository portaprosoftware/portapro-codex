import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FuelSupplier } from '@/types/fuel';
import { Building2, Mail, Phone, DollarSign, FileText, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface ViewSupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier: FuelSupplier | null;
}

export const ViewSupplierModal: React.FC<ViewSupplierModalProps> = ({
  isOpen,
  onClose,
  supplier,
}) => {
  if (!supplier) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Supplier Details
            </DialogTitle>
            <Badge 
              variant="outline" 
              className={supplier.is_active 
                ? "bg-gradient-to-r from-primary/10 to-primary/5 text-primary font-bold" 
                : "bg-muted text-muted-foreground font-bold"
              }
            >
              {supplier.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <DialogDescription>
            View supplier information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Supplier Name</label>
            <p className="text-sm text-muted-foreground">{supplier.supplier_name}</p>
          </div>

          {supplier.contact_name && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground">Contact Name</label>
              <p className="text-sm text-muted-foreground">{supplier.contact_name}</p>
            </div>
          )}

          {supplier.contact_phone && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Contact Phone
              </label>
              <p className="text-sm text-muted-foreground">{supplier.contact_phone}</p>
            </div>
          )}

          {supplier.contact_email && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Contact Email
              </label>
              <p className="text-sm text-muted-foreground">{supplier.contact_email}</p>
            </div>
          )}

          {supplier.payment_terms && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Payment Terms
              </label>
              <p className="text-sm text-muted-foreground">{supplier.payment_terms}</p>
            </div>
          )}

          {supplier.notes && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Notes
              </label>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{supplier.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Created: {format(new Date(supplier.created_at), 'PPP')}</span>
            </div>
            {supplier.updated_at && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Updated: {format(new Date(supplier.updated_at), 'PPP')}</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
