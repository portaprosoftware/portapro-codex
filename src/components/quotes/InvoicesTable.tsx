import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { MoreHorizontal, Eye, Download, Edit, Trash2, Send, CreditCard } from 'lucide-react';

interface InvoicesTableProps {
  searchTerm: string;
}

export function InvoicesTable({ searchTerm }: InvoicesTableProps) {
  const { data: invoices = [], isLoading, error } = useQuery({
    queryKey: ['invoices', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`invoice_number.ilike.%${searchTerm}%`);
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
    return format(new Date(dateString), 'MMM d, yyyy');
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'paid': 'bg-green-500 hover:bg-green-600',
      'unpaid': 'bg-red-500 hover:bg-red-600',
      'overdue': 'bg-orange-500 hover:bg-orange-600',
      'cancelled': 'bg-gray-500 hover:bg-gray-600',
      'partial': 'bg-yellow-500 hover:bg-yellow-600'
    };

    return (
      <Badge className={`text-white ${statusColors[status as keyof typeof statusColors] || 'bg-blue-500'}`}>
        {status}
      </Badge>
    );
  };

  const isDueSoon = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid' || status === 'cancelled') return false;
    const due = new Date(dueDate);
    const today = new Date();
    return due < today;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Loading invoices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-red-600">Error loading invoices</div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="border-border">
            <TableHead className="font-medium text-foreground">Invoice #</TableHead>
            <TableHead className="font-medium text-foreground">Customer</TableHead>
            <TableHead className="font-medium text-foreground">Date</TableHead>
            <TableHead className="font-medium text-foreground">Amount</TableHead>
            <TableHead className="font-medium text-foreground">Status</TableHead>
            <TableHead className="font-medium text-foreground">Due Date</TableHead>
            <TableHead className="font-medium text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No invoices found
              </TableCell>
            </TableRow>
          ) : (
            invoices.map((invoice: any) => {
              const dueSoon = isDueSoon(invoice.due_date, invoice.status);
              const overdue = isOverdue(invoice.due_date, invoice.status);

              return (
                <TableRow 
                  key={invoice.id} 
                  className={`hover:bg-muted/50 border-border ${
                    overdue ? 'bg-red-50 dark:bg-red-950/20' : 
                    dueSoon ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''
                  }`}
                >
                  <TableCell className="font-mono text-sm font-medium">
                    {invoice.invoice_number}
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    Customer #{invoice.customer_id.substring(0, 8)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(invoice.created_at)}
                  </TableCell>
                  <TableCell className="font-semibold text-foreground">
                    {formatCurrency(invoice.amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(invoice.status)}
                      {overdue && (
                        <span className="text-xs text-red-600 font-medium">OVERDUE</span>
                      )}
                      {dueSoon && !overdue && (
                        <span className="text-xs text-yellow-600 font-medium">DUE SOON</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={`${
                    overdue ? 'text-red-600 font-semibold' : 
                    dueSoon ? 'text-yellow-600 font-medium' : 'text-muted-foreground'
                  }`}>
                    {formatDate(invoice.due_date)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download PDF
                        </DropdownMenuItem>
                        {invoice.status === 'unpaid' && (
                          <>
                            <DropdownMenuItem>
                              <Send className="mr-2 h-4 w-4" />
                              Send Invoice
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-blue-600 focus:text-blue-600">
                              <CreditCard className="mr-2 h-4 w-4" />
                              Collect Payment
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}