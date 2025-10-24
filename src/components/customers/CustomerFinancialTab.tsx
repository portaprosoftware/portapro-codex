
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, DollarSign, Clock, Eye, MoreHorizontal, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { ViewQuoteModal } from '@/components/quotes/ViewQuoteModal';
import { InvoiceDetailModal } from '@/components/quotes/InvoiceDetailModal';
import { CollectPaymentModal } from '@/components/quotes/CollectPaymentModal';
import { getInvoiceStatusBadgeVariant } from '@/lib/statusBadgeUtils';

interface CustomerFinancialTabProps {
  customerId: string;
}

export function CustomerFinancialTab({ customerId }: CustomerFinancialTabProps) {
  const [activeTab, setActiveTab] = useState('quotes');
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any>(null);

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

  const getQuoteStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', className: 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-medium border-0' },
      accepted: { label: 'Accepted', className: 'bg-gradient-to-r from-green-500 to-green-600 text-white font-medium border-0' },
      rejected: { label: 'Rejected', className: 'bg-gradient-to-r from-red-500 to-red-600 text-white font-medium border-0' },
      expired: { label: 'Expired', className: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white font-medium border-0' },
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getInvoiceStatusBadge = (status: string) => {
    const variant = getInvoiceStatusBadgeVariant(status as any);
    const statusLabels = {
      paid: 'Paid',
      unpaid: 'Unpaid',
      overdue: 'Overdue',
      cancelled: 'Cancelled',
      partial: 'Partial',
    };
    return <Badge variant={variant} className="font-medium">{statusLabels[status as keyof typeof statusLabels] || status}</Badge>;
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
        <div className="p-6 pb-0">
          <h2 className="text-lg font-semibold font-inter">Financial Records</h2>
          <p className="text-sm text-muted-foreground mb-4">View quotes and invoices for this customer</p>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="inline-flex h-10 items-center justify-start rounded-lg bg-gray-100 p-1 text-muted-foreground">
              <TabsTrigger 
                value="quotes" 
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm bg-transparent text-black"
              >
                Quotes ({quotes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="invoices"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm bg-transparent text-black"
              >
                Invoices ({invoices.length})
              </TabsTrigger>
            </TabsList>

          <TabsContent value="quotes" className="pt-6">
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
                        {getQuoteStatusBadge(quote.status)}
                      </TableCell>
                      <TableCell>
                        {quote.expiration_date ? format(new Date(quote.expiration_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedQuoteId(quote.id)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Quote
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="invoices" className="pt-6">
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
                        {getInvoiceStatusBadge(invoice.status)}
                      </TableCell>
                      <TableCell>
                        {invoice.due_date ? format(new Date(invoice.due_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => setSelectedInvoice(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {(invoice.status === 'unpaid' || invoice.status === 'overdue') && (
                              <DropdownMenuItem 
                                className="text-blue-600 focus:text-blue-600"
                                onClick={() => setSelectedInvoiceForPayment(invoice)}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Collect Payment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
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

      {/* Modals */}
      <ViewQuoteModal
        isOpen={!!selectedQuoteId}
        onClose={() => setSelectedQuoteId('')}
        quoteId={selectedQuoteId}
      />
      <InvoiceDetailModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
      />
      {selectedInvoiceForPayment && (
        <CollectPaymentModal
          invoice={selectedInvoiceForPayment}
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
        />
      )}
    </div>
  );
}
