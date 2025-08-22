import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Receipt, Eye, Download, Send } from 'lucide-react';

interface InvoiceStatusDisplayProps {
  jobId?: string;
  quoteId?: string;
  showCreateButton?: boolean;
  onCreateInvoice?: () => void;
}

export function InvoiceStatusDisplay({ jobId, quoteId, showCreateButton = true, onCreateInvoice }: InvoiceStatusDisplayProps) {
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['related-invoices', jobId || quoteId],
    queryFn: async () => {
      if (!jobId && !quoteId) return [];
      
      let query = supabase
        .from('invoices')
        .select('id, invoice_number, amount, status, created_at, due_date');
      
      if (jobId) {
        query = query.eq('job_id', jobId);
      } else if (quoteId) {
        query = query.eq('quote_id', quoteId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!(jobId || quoteId)
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'overdue':
        return 'destructive';
      case 'draft':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Related Invoices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Loading invoices...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Related Invoices
          </div>
          {showCreateButton && onCreateInvoice && invoices.length === 0 && (
            <Button size="sm" onClick={onCreateInvoice}>
              <Receipt className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {invoices.length === 0 ? (
          <div className="text-center py-6">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No invoices created yet</p>
            {showCreateButton && onCreateInvoice && (
              <Button onClick={onCreateInvoice}>
                <Receipt className="h-4 w-4 mr-2" />
                Create First Invoice
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-medium">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(invoice.amount)} • Due: {new Date(invoice.due_date).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant={getStatusColor(invoice.status)}>
                    {invoice.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}