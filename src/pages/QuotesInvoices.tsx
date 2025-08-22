import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabNav } from '@/components/ui/TabNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  DollarSign,
  TrendingUp, 
  Search, 
  MoreHorizontal,
  Plus,
  Download
} from 'lucide-react';
import { QuoteExportModal } from '@/components/quotes/QuoteExportModal';
import { InvoiceExportModal } from '@/components/quotes/InvoiceExportModal';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import { InvoicesTable } from '@/components/quotes/InvoicesTable';
import { NewQuoteWizard } from '@/components/quotes/NewQuoteWizard';
import { QuoteDraftManagement } from '@/components/quotes/QuoteDraftManagement';
import { InvoiceCreationWizard } from '@/components/quotes/InvoiceCreationWizard';

const QuotesInvoices: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const [activeTab, setActiveTab] = useState('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteExport, setShowQuoteExport] = useState(false);
  const [showInvoiceExport, setShowInvoiceExport] = useState(false);
  const [showQuickBooksExport, setShowQuickBooksExport] = useState(false);
  const [showQuoteWizard, setShowQuoteWizard] = useState(false);
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);

  // Fetch quote metrics
  const { data: quoteMetrics } = useQuery({
    queryKey: ['quote-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_quote_metrics');
      if (error) throw error;
      return data as any;
    }
  });

  // Fetch invoice metrics
  const { data: invoiceMetrics } = useQuery({
    queryKey: ['invoice-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invoice_metrics');
      if (error) throw error;
      return data as any;
    }
  });


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
      {/* Page Header with Navigation Pills */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 font-inter">Quotes & Invoices Management</h1>
            <p className="text-base text-gray-600 font-inter mt-1">Create and manage quotes and invoices with inventory and maintenance services</p>
          </div>
          
          {/* Quotes & Invoices Sub-Navigation Pills */}
          <div className="flex items-center space-x-4">
            <div className="enterprise-tabs">
              <TabNav ariaLabel="Quotes and Invoices">
                <TabNav.Item 
                  to="#" 
                  isActive={activeTab === 'quotes'}
                  onClick={() => setActiveTab('quotes')}
                >
                  <FileText className="w-4 h-4" />
                  Quotes
                </TabNav.Item>
                <TabNav.Item 
                  to="#" 
                  isActive={activeTab === 'invoices'}
                  onClick={() => setActiveTab('invoices')}
                >
                  <DollarSign className="w-4 h-4" />
                  Invoices
                </TabNav.Item>
              </TabNav>
            </div>
          </div>
        </div>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'quotes' && (
        <div className="space-y-6">

          {/* Quote Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Quote Value */}
            <Card className="border-transparent bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Total Quote Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(quoteMetrics?.total_value)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Pending Value */}
            <Card className="border-transparent bg-gradient-to-r from-yellow-500 to-yellow-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Pending Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(quoteMetrics?.pending_value)}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Accepted Value */}
            <Card className="border-transparent bg-gradient-to-r from-green-600 to-green-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Accepted Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(quoteMetrics?.accepted_value)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quotes Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">All Quotes</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowQuoteExport(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => setShowQuickBooksExport(true)}
                  style={{ 
                    background: 'linear-gradient(to right, #059669, #047857)',
                    color: 'white',
                    border: 'none'
                  }}
                  className="hover:opacity-90 font-bold transition-opacity"
                >
                  Export to QuickBooks
                </Button>
                <Button 
                  onClick={() => setShowQuoteWizard(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Quote
                </Button>
              </div>
            </div>

            <QuotesTable searchTerm={searchTerm} />
          </div>

          {/* Quote Drafts Section */}
          <QuoteDraftManagement />
        </div>
      )}

      {activeTab === 'invoices' && (
        <div className="space-y-6">
          {/* Invoice Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Total Invoice Value */}
            <Card className="border-transparent bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Total Invoice Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(invoiceMetrics?.total_value)}
                    </p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Unpaid Value */}
            <Card className="border-transparent bg-gradient-to-r from-yellow-500 to-yellow-700 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Unpaid Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(invoiceMetrics?.unpaid_value)}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>

            {/* Paid Value */}
            <Card className="border-transparent bg-gradient-to-r from-green-600 to-green-800 text-white">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/90">Paid Value</p>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(invoiceMetrics?.paid_value)}
                    </p>
                  </div>
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoices Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">All Invoices</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowInvoiceExport(true)}
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button 
                  onClick={() => setShowQuickBooksExport(true)}
                  style={{ 
                    background: 'linear-gradient(to right, #059669, #047857)',
                    color: 'white',
                    border: 'none'
                  }}
                  className="hover:opacity-90 font-bold transition-opacity"
                >
                  Export to QuickBooks
                </Button>
                <Button 
                  onClick={() => setShowInvoiceWizard(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Invoice
                </Button>
              </div>
            </div>

            <InvoicesTable searchTerm={searchTerm} />
          </div>
        </div>
      )}

      {/* Export Modals - Temporarily disabled until we have selected items */}
      {/*
      <QuoteExportModal 
        isOpen={showQuoteExport} 
        onClose={() => setShowQuoteExport(false)} 
        quote={{ id: '', quote_number: '', customers: { name: '', email: '' } }}
      />
      <QuoteExportModal 
        isOpen={showQuickBooksExport} 
        onClose={() => setShowQuickBooksExport(false)}
        quote={{ id: '', quote_number: '', customers: { name: '', email: '' } }}
      />
      <InvoiceExportModal 
        isOpen={showInvoiceExport} 
        onClose={() => setShowInvoiceExport(false)} 
        invoice={{ id: '', invoice_number: '', customers: { name: '', email: '' } }}
      />
      */}

      {/* Creation Wizards */}
      <NewQuoteWizard 
        open={showQuoteWizard} 
        onOpenChange={setShowQuoteWizard}
      />
      <InvoiceCreationWizard 
        isOpen={showInvoiceWizard} 
        onClose={() => setShowInvoiceWizard(false)} 
      />
      </div>
    </div>
  );
};

export default QuotesInvoices;