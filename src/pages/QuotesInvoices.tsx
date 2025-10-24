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
import { FloatingActionButton } from '@/components/ui/floating-action-button';
import { QuotesTable } from '@/components/quotes/QuotesTable';
import { InvoicesTable } from '@/components/quotes/InvoicesTable';
import { NewQuoteWizard } from '@/components/quotes/NewQuoteWizard';
import { QuoteDraftManagement } from '@/components/quotes/QuoteDraftManagement';
import { InvoiceCreationWizard } from '@/components/quotes/InvoiceCreationWizard';
import { QuotesExportModal } from '@/components/quotes/QuotesExportModal';
import { InvoicesExportModal } from '@/components/invoices/InvoicesExportModal';
import { QuickBooksExportModal } from '@/components/quotes/QuickBooksExportModal';
import { QuoteDateFilters } from '@/components/quotes/QuoteDateFilters';
import { QuickDateFilters } from '@/components/quotes/QuickDateFilters';
import { MobileDateFilterDrawer } from '@/components/quotes/MobileDateFilterDrawer';
import { KpiCard } from '@/components/quotes/KpiCard';
import { MobileMoreMenu } from '@/components/quotes/MobileMoreMenu';
import { ActiveFilterChip } from '@/components/quotes/ActiveFilterChip';
import { DateRange } from 'react-day-picker';

const QuotesInvoices: React.FC = () => {
  const { hasAdminAccess } = useUserRole();
  const [activeTab, setActiveTab] = useState('quotes');
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuoteExport, setShowQuoteExport] = useState(false);
  const [showInvoiceExport, setShowInvoiceExport] = useState(false);
  const [showQuickBooksQuoteExport, setShowQuickBooksQuoteExport] = useState(false);
  const [showQuickBooksInvoiceExport, setShowQuickBooksInvoiceExport] = useState(false);
  const [showQuoteWizard, setShowQuoteWizard] = useState(false);
  const [showInvoiceWizard, setShowInvoiceWizard] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [activeQuickFilter, setActiveQuickFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  // Fetch quote metrics (year-to-date)
  const { data: quoteMetrics } = useQuery({
    queryKey: ['quote-metrics-ytd'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_quote_metrics_ytd');
      if (error) throw error;
      return data as any;
    }
  });

  // Fetch invoice metrics (year-to-date)
  const { data: invoiceMetrics } = useQuery({
    queryKey: ['invoice-metrics-ytd'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_invoice_metrics_ytd');
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
        {/* Page Header */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900">Quotes & Invoices Management</h1>
          <p className="text-base text-gray-600 mt-1">Create and manage quotes and invoices with inventory and maintenance services</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          {/* Quotes & Invoices Sub-Navigation Pills */}
          <div className="mb-6">
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

          {/* Conditional Content Based on Active Tab */}
          {activeTab === 'quotes' && (
            <div className="space-y-6">

              {/* Quote Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  title={`Total Quote Value (${quoteMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(quoteMetrics?.total_value)}
                  icon={TrendingUp}
                  gradient="bg-gradient-to-r from-blue-600 to-blue-800"
                />
                <KpiCard
                  title={`Pending Value (${quoteMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(quoteMetrics?.pending_value)}
                  icon={FileText}
                  gradient="bg-gradient-to-r from-yellow-500 to-yellow-700"
                />
                <KpiCard
                  title={`Accepted Value (${quoteMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(quoteMetrics?.accepted_value)}
                  icon={DollarSign}
                  gradient="bg-gradient-to-r from-green-600 to-green-800"
                />
              </div>

              {/* Date Filters - Mobile Drawer */}
              <div className="lg:hidden">
                <MobileDateFilterDrawer
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  activeFilter={activeQuickFilter}
                  onActiveFilterChange={setActiveQuickFilter}
                />
              </div>

              {/* Date Filters - Desktop */}
              <div className="hidden lg:block">
                <QuoteDateFilters 
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              {/* Quotes Section */}
              <div className="space-y-4">
                {/* Header - Desktop */}
                <div className="hidden lg:flex items-center justify-between">
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
                      onClick={() => setShowQuickBooksQuoteExport(true)}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white hidden lg:flex"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Quote
                    </Button>
                  </div>
                </div>

                {/* Header - Mobile */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">All Quotes</h2>
                    <MobileMoreMenu
                      type="quotes"
                      onExport={() => setShowQuoteExport(true)}
                      onQuickBooksExport={() => setShowQuickBooksQuoteExport(true)}
                    />
                  </div>
                  {statusFilter && (
                    <ActiveFilterChip
                      label={`Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
                      onClear={() => setStatusFilter(undefined)}
                    />
                  )}
                  <Input
                    placeholder="Search quotes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full min-h-[44px] text-base"
                  />
                </div>

                <QuotesTable searchTerm={searchTerm} dateRange={dateRange} />
              </div>

              {/* Quote Drafts Section */}
              <QuoteDraftManagement />
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="space-y-6">
              {/* Invoice Metrics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KpiCard
                  title={`Total Invoice Value (${invoiceMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(invoiceMetrics?.total_value)}
                  icon={TrendingUp}
                  gradient="bg-gradient-to-r from-blue-600 to-blue-800"
                />
                <KpiCard
                  title={`Unpaid Value (${invoiceMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(invoiceMetrics?.unpaid_value)}
                  icon={FileText}
                  gradient="bg-gradient-to-r from-yellow-500 to-yellow-700"
                />
                <KpiCard
                  title={`Paid Value (${invoiceMetrics?.year || new Date().getFullYear()} YTD)`}
                  value={formatCurrency(invoiceMetrics?.paid_value)}
                  icon={DollarSign}
                  gradient="bg-gradient-to-r from-green-600 to-green-800"
                />
              </div>

              {/* Date Filters - Mobile Drawer */}
              <div className="lg:hidden">
                <MobileDateFilterDrawer
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                  activeFilter={activeQuickFilter}
                  onActiveFilterChange={setActiveQuickFilter}
                />
              </div>

              {/* Date Filters - Desktop */}
              <div className="hidden lg:block">
                <QuoteDateFilters 
                  dateRange={dateRange}
                  onDateRangeChange={setDateRange}
                />
              </div>

              {/* Invoices Section */}
              <div className="space-y-4">
                {/* Header - Desktop */}
                <div className="hidden lg:flex items-center justify-between">
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
                      onClick={() => setShowQuickBooksInvoiceExport(true)}
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
                      className="bg-blue-600 hover:bg-blue-700 text-white hidden lg:flex"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                </div>

                {/* Header - Mobile */}
                <div className="lg:hidden space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-foreground">All Invoices</h2>
                    <MobileMoreMenu
                      type="invoices"
                      onExport={() => setShowInvoiceExport(true)}
                      onQuickBooksExport={() => setShowQuickBooksInvoiceExport(true)}
                    />
                  </div>
                  {statusFilter && (
                    <ActiveFilterChip
                      label={`Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
                      onClear={() => setStatusFilter(undefined)}
                    />
                  )}
                  <Input
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full min-h-[44px] text-base"
                  />
                </div>

                <InvoicesTable searchTerm={searchTerm} dateRange={dateRange} />
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Export Modals */}
      <QuotesExportModal 
        isOpen={showQuoteExport} 
        onClose={() => setShowQuoteExport(false)} 
      />
      <InvoicesExportModal 
        isOpen={showInvoiceExport} 
        onClose={() => setShowInvoiceExport(false)} 
      />
      
      {/* QuickBooks Export Modals */}
      <QuickBooksExportModal 
        isOpen={showQuickBooksQuoteExport} 
        onClose={() => setShowQuickBooksQuoteExport(false)}
        type="quotes"
      />
      <QuickBooksExportModal 
        isOpen={showQuickBooksInvoiceExport} 
        onClose={() => setShowQuickBooksInvoiceExport(false)}
        type="invoices"
      />

      {/* Creation Wizards */}
      <NewQuoteWizard 
        open={showQuoteWizard} 
        onOpenChange={setShowQuoteWizard}
      />
      <InvoiceCreationWizard 
        isOpen={showInvoiceWizard} 
        onClose={() => setShowInvoiceWizard(false)} 
      />

      {/* Floating Action Button - visible on mobile/tablet only */}
      <div className="lg:hidden">
        {activeTab === 'quotes' && (
          <FloatingActionButton
            icon={Plus}
            onClick={() => setShowQuoteWizard(true)}
            variant="primary"
            tooltip="Create Quote"
          />
        )}
        {activeTab === 'invoices' && (
          <FloatingActionButton
            icon={Plus}
            onClick={() => setShowInvoiceWizard(true)}
            variant="success"
            tooltip="Create Invoice"
          />
        )}
      </div>
    </div>
  );
};

export default QuotesInvoices;