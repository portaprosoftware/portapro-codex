import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface QuotesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string;
  customers: string[];
  format: 'csv' | 'pdf';
  includeDetails: boolean;
  includeItems: boolean;
}

export function QuotesExportModal({ isOpen, onClose }: QuotesExportModalProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: { from: undefined, to: undefined },
    status: 'all',
    customers: [],
    format: 'csv',
    includeDetails: true,
    includeItems: false
  });
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (exportFilters: ExportFilters) => {
      // Build query based on filters
      let query = supabase
        .from('quotes')
        .select(`
          *,
          customer:customers(name, email, phone),
          quote_items(*)
        `);

      // Apply filters
      if (exportFilters.dateRange.from) {
        query = query.gte('created_at', exportFilters.dateRange.from.toISOString());
      }
      if (exportFilters.dateRange.to) {
        query = query.lte('created_at', exportFilters.dateRange.to.toISOString());
      }
      if (exportFilters.status !== 'all') {
        query = query.eq('status', exportFilters.status);
      }
      if (exportFilters.customers.length > 0) {
        query = query.in('customer_id', exportFilters.customers);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (filters.format === 'csv') {
        const csvContent = generateCSVContent(data);
        downloadCSV(csvContent, `quotes_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      } else {
        const htmlContent = generateHTMLReport(data);
        downloadPDF(htmlContent);
      }
      
      toast({
        title: "Export Complete",
        description: `Quotes data exported successfully as ${filters.format.toUpperCase()}.`
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to export quotes data. Please try again.",
        variant: "destructive"
      });
      console.error('Export error:', error);
    }
  });

  const generateCSVContent = (records: any[]) => {
    if (records.length === 0) return '';
    
    const headers = [
      'Quote Number',
      'Customer Name',
      'Created Date',
      'Expiration Date',
      'Status',
      'Subtotal',
      'Tax Amount',
      'Total Amount',
      'Notes'
    ];

    if (filters.includeItems) {
      headers.push('Items Count', 'Items Detail');
    }

    const rows = records.map(record => {
      const baseRow = [
        record.quote_number || '',
        record.customer?.name || '',
        record.created_at ? format(new Date(record.created_at), 'yyyy-MM-dd') : '',
        record.expiration_date ? format(new Date(record.expiration_date), 'yyyy-MM-dd') : '',
        record.status || '',
        record.subtotal || 0,
        record.tax_amount || 0,
        record.total_amount || 0,
        record.notes || ''
      ];

      if (filters.includeItems) {
        const itemsCount = record.quote_items?.length || 0;
        const itemsDetail = record.quote_items?.map((item: any) => 
          `${item.product_name} (Qty: ${item.quantity}, Price: $${item.unit_price})`
        ).join('; ') || '';
        
        baseRow.push(itemsCount.toString(), itemsDetail);
      }

      return baseRow.map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      );
    });
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  };

  const generateHTMLReport = (records: any[]) => {
    const totalValue = records.reduce((sum, record) => sum + (record.total_amount || 0), 0);
    const statusCounts = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotes Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .header { text-align: center; margin-bottom: 30px; }
          .summary { background: #f5f5f5; padding: 15px; margin-bottom: 20px; border-radius: 5px; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          .summary-item { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; }
          .amount { text-align: right; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Quotes Report</h1>
          <p>Generated on ${format(new Date(), 'MMM dd, yyyy')}</p>
          ${filters.dateRange.from && filters.dateRange.to ? 
            `<p>Period: ${format(filters.dateRange.from, 'MMM dd, yyyy')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}</p>` : 
            ''
          }
        </div>
        
        <div class="summary">
          <h2>Summary</h2>
          <div class="summary-grid">
            <div class="summary-item">
              <h3>Total Quotes</h3>
              <p style="font-size: 24px; color: #4f46e5;">${records.length}</p>
            </div>
            <div class="summary-item">
              <h3>Total Value</h3>
              <p style="font-size: 24px; color: #059669;">$${totalValue.toLocaleString()}</p>
            </div>
            <div class="summary-item">
              <h3>Average Value</h3>
              <p style="font-size: 24px; color: #dc2626;">$${records.length > 0 ? (totalValue / records.length).toFixed(2) : '0'}</p>
            </div>
          </div>
          <div style="margin-top: 15px;">
            <strong>Status Breakdown:</strong>
            ${Object.entries(statusCounts).map(([status, count]) => 
              `<span style="margin-right: 15px;">${status}: ${count}</span>`
            ).join('')}
          </div>
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Quote #</th>
              <th>Customer</th>
              <th>Created</th>
              <th>Status</th>
              <th>Total Amount</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(record => `
              <tr>
                <td>${record.quote_number || ''}</td>
                <td>${record.customer?.name || ''}</td>
                <td>${record.created_at ? format(new Date(record.created_at), 'MMM dd, yyyy') : ''}</td>
                <td>${record.status || ''}</td>
                <td class="amount">$${(record.total_amount || 0).toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPDF = (htmlContent: string) => {
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
      newWindow.print();
    }
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      status: 'all',
      customers: [],
      format: 'csv',
      includeDetails: true,
      includeItems: false
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Quotes Data
          </DialogTitle>
          <DialogDescription>
            Export quotes data for reporting and analysis. Select your filters and format below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range</Label>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? format(filters.dateRange.from, 'MMM dd, yyyy') : 'From date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.from}
                    onSelect={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, from: date }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.dateRange.to ? format(filters.dateRange.to, 'MMM dd, yyyy') : 'To date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.dateRange.to}
                    onSelect={(date) => setFilters(prev => ({
                      ...prev,
                      dateRange: { ...prev.dateRange, to: date }
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Status Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Quote Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="sent">Sent</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-details"
                  checked={filters.includeDetails}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeDetails: !!checked }))}
                />
                <Label htmlFor="include-details" className="text-sm font-normal">
                  Include detailed information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-items"
                  checked={filters.includeItems}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeItems: !!checked }))}
                />
                <Label htmlFor="include-items" className="text-sm font-normal">
                  Include line items (CSV only)
                </Label>
              </div>
            </div>
          </div>

          {/* Export Format */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Format</Label>
            <Select value={filters.format} onValueChange={(value: 'csv' | 'pdf') => setFilters(prev => ({ ...prev, format: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                <SelectItem value="pdf">PDF (Report)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Export Summary
            </h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>
                <span className="font-medium">Date Range:</span>{' '}
                {filters.dateRange.from && filters.dateRange.to
                  ? `${format(filters.dateRange.from, 'MMM dd, yyyy')} - ${format(filters.dateRange.to, 'MMM dd, yyyy')}`
                  : 'All dates'
                }
              </p>
              <p>
                <span className="font-medium">Status:</span> {filters.status === 'all' ? 'All statuses' : filters.status}
              </p>
              <p>
                <span className="font-medium">Format:</span> {filters.format.toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport}
            disabled={exportMutation.isPending}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold border-0 hover:from-blue-700 hover:to-blue-800"
          >
            {exportMutation.isPending ? (
              "Exporting..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}