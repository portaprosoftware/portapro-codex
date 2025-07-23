
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, DollarSign, Clock, Eye, Download } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerFinancialTabProps {
  customerId: string;
}

export function CustomerFinancialTab({ customerId }: CustomerFinancialTabProps) {
  const [activeTab, setActiveTab] = useState('quotes');

  // Fetch quotes
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['customer-quotes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['customer-invoices', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Calculate financial metrics
  const totalQuoted = quotes.reduce((sum, quote) => sum + (quote.total_amount || 0), 0);
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + (invoice.amount || 0), 0);
  const outstanding = invoices
    .filter(invoice => invoice.status === 'unpaid')
    .reduce((sum, invoice) => sum + (invoice.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'accepted': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'expired': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-500';
      case 'unpaid': return 'bg-red-500';
      case 'overdue': return 'bg-orange-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-transparent bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">Total Quotes</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(totalQuoted)}
                </p>
              </div>
              <FileText className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-gradient-to-r from-green-600 to-green-800 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">Total Invoiced</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(totalInvoiced)}
                </p>
              </div>
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-gradient-to-r from-orange-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-white/90">Outstanding</p>
                <p className="text-3xl font-bold text-white">
                  {formatCurrency(outstanding)}
                </p>
              </div>
              <Clock className="h-6 w-6 text-white" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Records Tabs */}
      <div className="bg-card rounded-2xl border shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start border-b border-border rounded-none bg-transparent p-0">
            <TabsTrigger 
              value="quotes" 
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Quotes ({quotes.length})
            </TabsTrigger>
            <TabsTrigger 
              value="invoices"
              className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
            >
              Invoices ({invoices.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quotes" className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-foreground">Quote #</TableHead>
                  <TableHead className="font-medium text-foreground">Date</TableHead>
                  <TableHead className="font-medium text-foreground">Amount</TableHead>
                  <TableHead className="font-medium text-foreground">Status</TableHead>
                  <TableHead className="font-medium text-foreground">Expires</TableHead>
                  <TableHead className="font-medium text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {quotesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading quotes...
                    </TableCell>
                  </TableRow>
                ) : quotes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No quotes found
                    </TableCell>
                  </TableRow>
                ) : (
                  quotes.map((quote) => (
                    <TableRow key={quote.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{quote.quote_number}</TableCell>
                      <TableCell>{format(new Date(quote.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(quote.total_amount)}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getQuoteStatusColor(quote.status)}`}>
                          {quote.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {quote.expiration_date ? format(new Date(quote.expiration_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="invoices" className="p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-medium text-foreground">Invoice #</TableHead>
                  <TableHead className="font-medium text-foreground">Date</TableHead>
                  <TableHead className="font-medium text-foreground">Amount</TableHead>
                  <TableHead className="font-medium text-foreground">Status</TableHead>
                  <TableHead className="font-medium text-foreground">Due Date</TableHead>
                  <TableHead className="font-medium text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Loading invoices...
                    </TableCell>
                  </TableRow>
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-sm">{invoice.invoice_number}</TableCell>
                      <TableCell>{format(new Date(invoice.created_at), 'MMM d, yyyy')}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>
                        <Badge className={`text-white ${getInvoiceStatusColor(invoice.status)}`}>
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
