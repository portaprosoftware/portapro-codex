import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface InvoicesTableProps {
  searchTerm: string;
}

export const InvoicesTable: React.FC<InvoicesTableProps> = ({ searchTerm }) => {
  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          customers:customer_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`invoice_number.ilike.%${searchTerm}%,customers.name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string, dueDate?: string) => {
    const isOverdue = dueDate && new Date(dueDate) < new Date() && status === 'unpaid';
    
    const statusConfig = {
      paid: { color: 'bg-green-100 text-green-800', label: 'Paid' },
      unpaid: { 
        color: isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800', 
        label: isOverdue ? 'Overdue' : 'Unpaid' 
      },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.unpaid;
    
    return (
      <Badge className={`${config.color} border-0 font-medium px-3 py-1 rounded-full`}>
        {config.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading invoices...</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/50">
            <TableHead className="font-medium text-sm text-foreground">Invoice #</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Customer</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Date</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Amount</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Status</TableHead>
            <TableHead className="font-medium text-sm text-foreground">Due Date</TableHead>
            <TableHead className="font-medium text-sm text-foreground w-12">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices?.map((invoice, index) => (
            <TableRow 
              key={invoice.id} 
              className={`border-b border-border ${index % 2 === 0 ? 'bg-muted/20' : 'bg-card'}`}
            >
              <TableCell className="font-medium text-sm text-foreground">
                {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
              </TableCell>
              <TableCell className="text-sm text-foreground">
                {(invoice.customers as any)?.name || 'Unknown Customer'}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(invoice.created_at)}
              </TableCell>
              <TableCell className="text-sm text-foreground font-medium">
                {formatCurrency(invoice.amount)}
              </TableCell>
              <TableCell>
                {getStatusBadge(invoice.status, invoice.due_date)}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDate(invoice.due_date)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>View</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>Send</DropdownMenuItem>
                    <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                    <DropdownMenuItem>Duplicate</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {(!invoices || invoices.length === 0) && (
        <div className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No invoices found</p>
        </div>
      )}
    </div>
  );
};