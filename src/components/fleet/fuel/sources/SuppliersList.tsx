import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, DollarSign, FileText } from 'lucide-react';
import { useFuelSuppliers } from '@/hooks/useFuelSuppliers';

export const SuppliersList: React.FC = () => {
  const { data: suppliers, isLoading } = useFuelSuppliers();

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
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
