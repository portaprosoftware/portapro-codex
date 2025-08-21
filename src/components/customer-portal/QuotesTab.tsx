import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Edit,
  AlertTriangle,
  FileSignature,
  ExternalLink,
  Eye,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface QuotesTabProps {
  customerId: string;
}

export const QuotesTab: React.FC<QuotesTabProps> = ({ customerId }) => {
  const [selectedQuote, setSelectedQuote] = useState<any>(null);

  // Fetch quotes data
  const { data: quotes = [], isLoading: quotesLoading } = useQuery({
    queryKey: ['customer-quotes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  // Fetch customer contracts
  const { data: contracts = [], isLoading: contractsLoading } = useQuery({
    queryKey: ['customer-contracts', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_contracts')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!customerId,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(amount / 100);
  };

  const getQuoteStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQuoteStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return CheckCircle;
      case 'sent': return Clock;
      case 'draft': return Edit;
      case 'expired': return AlertTriangle;
      case 'declined': return XCircle;
      default: return FileText;
    }
  };

  const getContractStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (quotesLoading || contractsLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse border rounded-lg p-6">
            <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Quotes & Agreements</h3>
        <p className="text-sm text-muted-foreground">
          Review quotes, sign agreements, and manage contracts
        </p>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="quotes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="quotes">Quotes</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="agreements">Service Agreements</TabsTrigger>
        </TabsList>

        <TabsContent value="quotes" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Quote History</h4>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export All
            </Button>
          </div>

          <div className="space-y-3">
            {quotes.map((quote) => {
              const StatusIcon = getQuoteStatusIcon(quote.status);
              const isExpired = quote.expiration_date && new Date(quote.expiration_date) < new Date();
              const canAccept = quote.status === 'sent' && !isExpired;
              
              return (
                <Card key={quote.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <StatusIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium">{quote.quote_number}</h5>
                            <Badge className={cn("text-xs", getQuoteStatusColor(quote.status))}>
                              {quote.status}
                            </Badge>
                            {isExpired && (
                              <Badge className="text-xs bg-red-100 text-red-800 border-red-200">
                                Expired
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {quote.expiration_date && (
                              <>Expires: {format(new Date(quote.expiration_date), 'MMM dd, yyyy')}</>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">{formatCurrency(quote.total_amount || 0)}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(quote.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedQuote(quote)}
                                className="gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Quote {quote.quote_number}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Total Amount</label>
                                    <p className="text-xl font-semibold">{formatCurrency(quote.total_amount || 0)}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <Badge className={cn("text-xs", getQuoteStatusColor(quote.status))}>
                                      {quote.status}
                                    </Badge>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Quote Date</label>
                                    <p className="text-sm">{format(new Date(quote.created_at), 'MMM dd, yyyy')}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Expiration Date</label>
                                    <p className="text-sm">
                                      {quote.expiration_date ? format(new Date(quote.expiration_date), 'MMM dd, yyyy') : 'N/A'}
                                    </p>
                                  </div>
                                </div>

                                {quote.quote_items && quote.quote_items.length > 0 && (
                                  <div>
                                    <label className="text-sm font-medium">Line Items</label>
                                    <div className="mt-2 border rounded-lg">
                                      <div className="grid grid-cols-4 gap-4 p-3 bg-muted/50 border-b text-sm font-medium">
                                        <span>Item</span>
                                        <span>Quantity</span>
                                        <span>Unit Price</span>
                                        <span>Total</span>
                                      </div>
                                      {quote.quote_items.map((item: any, idx: number) => (
                                        <div key={idx} className="grid grid-cols-4 gap-4 p-3 border-b last:border-b-0 text-sm">
                                          <span>{item.product_name || 'Service Item'}</span>
                                          <span>{item.quantity}</span>
                                          <span>{formatCurrency(item.unit_price || 0)}</span>
                                          <span>{formatCurrency(item.line_total || 0)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {quote.notes && (
                                  <div>
                                    <label className="text-sm font-medium">Notes</label>
                                    <p className="text-sm text-muted-foreground mt-1">{quote.notes}</p>
                                  </div>
                                )}

                                <div className="flex gap-2 pt-4 border-t">
                                  <Button className="gap-2">
                                    <Download className="h-4 w-4" />
                                    Download PDF
                                  </Button>
                                  {canAccept && (
                                    <Button className="gap-2">
                                      <CheckCircle className="h-4 w-4" />
                                      Accept Quote
                                    </Button>
                                  )}
                                  {quote.status === 'sent' && (
                                    <Button variant="outline" className="gap-2">
                                      <XCircle className="h-4 w-4" />
                                      Decline
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button variant="outline" size="sm" className="gap-1">
                            <Download className="h-3 w-3" />
                            PDF
                          </Button>

                          {canAccept && (
                            <Button size="sm" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Accept
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {quotes.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h5 className="font-medium mb-2">No Quotes Available</h5>
                  <p className="text-muted-foreground">
                    You haven't received any quotes yet. Contact us for a custom quote.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Contract Documents</h4>
            <Button variant="outline" size="sm" className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </div>

          <div className="space-y-3">
            {contracts.map((contract) => (
              <Card key={contract.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{contract.document_name}</h5>
                          <Badge className={cn("text-xs", getContractStatusColor(contract.is_active))}>
                            {contract.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {contract.document_category} • {contract.file_type}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        {contract.contract_value && (
                          <p className="font-semibold">{formatCurrency(contract.contract_value)}</p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(contract.created_at), 'MMM dd, yyyy')}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Download className="h-3 w-3" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {contracts.length === 0 && (
              <Card>
                <CardContent className="p-6 text-center">
                  <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h5 className="font-medium mb-2">No Contract Documents</h5>
                  <p className="text-muted-foreground">
                    Contract documents will appear here once uploaded or generated.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="agreements" className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-md font-medium">Service Agreements</h4>
            <Button variant="outline" size="sm" className="gap-2">
              <FileSignature className="h-4 w-4" />
              E-Sign Document
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <FileSignature className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h5 className="font-medium mb-2">Digital Signature Integration</h5>
              <p className="text-muted-foreground mb-4">
                Sign service agreements electronically and manage contract renewals
              </p>
              <div className="space-y-2">
                <Button>View Current Agreement</Button>
                <Button variant="outline">Renewal Notifications</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};