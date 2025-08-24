import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileText, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface QuickBooksExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'quotes' | 'invoices';
}

interface ExportFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string;
  includeLineItems: boolean;
  includeCustomerInfo: boolean;
}

export function QuickBooksExportModal({ isOpen, onClose, type }: QuickBooksExportModalProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: { from: undefined, to: undefined },
    status: 'all',
    includeLineItems: true,
    includeCustomerInfo: true
  });
  const { toast } = useToast();

  const exportMutation = useMutation({
    mutationFn: async (exportFilters: ExportFilters) => {
      const tableName = type === 'quotes' ? 'quotes' : 'invoices';
      const itemsTable = type === 'quotes' ? 'quote_items' : 'invoice_items';
      
      // Build query based on filters
      let query = supabase
        .from(tableName)
        .select(`
          *,
          customer:customers(name, email, phone, address),
          ${itemsTable}(*)
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

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const iifContent = generateIIFContent(data);
      downloadIIF(iifContent, `${type}_quickbooks_export_${format(new Date(), 'yyyy-MM-dd')}.iif`);
      
      toast({
        title: "Export Complete",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} exported to QuickBooks IIF format successfully.`
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: `Failed to export ${type} to QuickBooks. Please try again.`,
        variant: "destructive"
      });
      console.error('Export error:', error);
    }
  });

  const generateIIFContent = (records: any[]) => {
    if (records.length === 0) return '';
    
    const lines: string[] = [];
    
    // IIF Header
    lines.push('!HDR\tVERSN\t1');
    lines.push('!HDR\tTEXTUSA\tMicrosoft Windows\t1252');
    lines.push('!HDR\tPROD\tQuickBooks Pro 2023');
    lines.push('!HDR\tACCNT\tY\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN\tN');
    lines.push('');

    // Customer information (if enabled)
    if (filters.includeCustomerInfo) {
      lines.push('!CUST\tNAME\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5\tPHONE1\tFAXNUM\tEMAIL\tCONTACT\tCTYPE\tTERMS\tTAXABLE\tSALESTAXCODE\tCUSTFLD1\tCUSTFLD2\tCUSTFLD3\tCUSTFLD4\tCUSTFLD5\tCUSTFLD6\tCUSTFLD7\tCUSTFLD8\tCUSTFLD9\tCUSTFLD10\tCUSTFLD11\tCUSTFLD12\tCUSTFLD13\tCUSTFLD14\tCUSTFLD15\tNOTE\tSALESREP\tTAXITEM\tRESALENUM\tREP\tTAXABLE\tPRICELEV\tCREDITLIM\tJOBTYPE\tJOBSTATUS\tJOBSTART\tJOBPROJEND\tJOBDESC\tHIDDEN\tDELCOUNT');
      
      // Add unique customers
      const uniqueCustomers = Array.from(
        new Map(records.map(record => [record.customer?.name, record.customer])).values()
      ).filter(customer => customer?.name);

      uniqueCustomers.forEach(customer => {
        if (customer) {
          lines.push(`CUST\t${customer.name}\t${customer.address || ''}\t\t\t\t\t${customer.phone || ''}\t\t${customer.email || ''}\t${customer.name}\tCUSTOMER\t\tY\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tN\t0`);
        }
      });
      lines.push('');
    }

      // Transaction headers
      if (type === 'quotes') {
        lines.push('!ESTIMATES\tDATE\tNUM\tNAME\tCLASS\tTOTAL\tMEMO\tCUSTMSG\tHIDDEN\tREP\tTERMS\tDUEDATE\tTOBEPRINTED\tSHIPDATE\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5\tSHIPADDR1\tSHIPADDR2\tSHIPADDR3\tSHIPADDR4\tSHIPADDR5\tTERMS\tITEM\tQTY\tRATE\tAMOUNT\tTAXABLE\tEXCHRATE\tDISCOUNTRATE\tDISCOUNTAMT\tTOTALAMT\tPAID\tCREDIT\tFOB\tPONUM\tTERM\tINVOICE\tTEXTUSA\tTIMECREATED\tTIMEMODIFIED\tSHIPVIA\tSALESTAXCODE\tTAXRATE\tGROSSAMT\tSALESTAX\tOTHER\tOTHER2\tOTHER3\tOTHER4\tOTHER5\tEXP\tPRICELEV\tSUGGESTDISCOUNT\tVOID\tPODATE\tINVDATE\tDUEDATE\tTERMS\tSHIPVIA\tFOB\tPONUMBER\tOTHER\tOTHER2\tREP\tEXCHRATE\tTIMECREATED\tTIMEMODIFIED\tHIDDEN\tSUGGESTRETAINAGE\tREP\tCOGS\tCOGSACCT\tINVENTORYQTY\tTEXTUSA\tTEXTUSB\tTEXTUSC\tTEXTUSD\tTEXTUSE\tTEXTUSF\tTEXTUSG\tTEXTUSH\tCUSTFLD1\tCUSTFLD2\tCUSTFLD3\tCUSTFLD4\tCUSTFLD5\tOTHER\tOTHER2\tOTHER3\tOTHER4\tOTHER5\tPAIDSTATUS\tVOID\tSUGGESTRETAINAGE\tCLEARED\tEXP\tCOGS\tCOGSACCT\tTAXLINE');
      } else if (type === 'invoices') {
        lines.push('!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT\tNAMEADDR1\tNAMEADDR2\tNAMEADDR3\tNAMEADDR4\tTERMS\tDUEDATE\tREP\tFOB\tSHIPMETH\tSHIPDATE\tITEM\tSERIALNUMS\tEXCHRATE\tTIMECREATED\tTIMEMODIFIED\tADDR1\tADDR2\tADDR3\tADDR4\tADDR5\tSHIPADDR1\tSHIPADDR2\tSHIPADDR3\tSHIPADDR4\tSHIPADDR5\tCUSTFLD1\tCUSTFLD2\tCUSTFLD3\tCUSTFLD4\tCUSTFLD5\tVOID\tNOTE\tPRICELEV\tSUGGESTDISCOUNT\tPAIDSTATUS\tCONTRACTOK\tSHIPVIA\tTAXRATE\tTAXABLE\tCOGS\tCOGSACCT\tSALESTAXCODE\tOTHER\tINVENTORYQTY\tINVTRANS\tOTHER2\tPODATE\tINVDATE\tOTHER1\tINVNUM\tPONUM\tADJACC\tADJUST\tOTHER3\tLOT\tMFGDATE\tEXPDATE\tTAXLINE\tASSET\tTRACKINGNUMS\tRETAINAGE\tCOMMISSION\tCOMMISSIONRATE\tEXCHRATE\tEXTRACOST\tEXPENSERATE\tBILLABLE\tREIMBURSABLE\tTAXABLE2\tNETAMOUNT\tCUSTFLD6\tCUSTFLD7\tCUSTFLD8\tCUSTFLD9\tCUSTFLD10\tCUSTFLD11\tCUSTFLD12\tCUSTFLD13\tCUSTFLD14\tCUSTFLD15\tOTHER4\tOTHER5\tRETAINAGERATE\tTIMEDATE\tTIMESTAMP\tPRICELEV\tBILLRATE\tPRICELEV\tPAYMETH\tYEAR\tCUSTFLD16\tCUSTFLD17\tCUSTFLD18\tCUSTFLD19\tCUSTFLD20\tTIMEID\tCONTRACTDATE');
        lines.push('!SPL\tSPLID\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tQNTY\tPRICE\tINVITEM\tPAYITEM\tTAXABLE\tVATCODE\tFOB\tTERMS\tDUEDATE\tREP\tCUSTFLD1\tCUSTFLD2\tCUSTFLD3\tCUSTFLD4\tCUSTFLD5\tEXTRA');
      }

    // Add transaction data
    records.forEach((record, index) => {
      const date = format(new Date(record.created_at), 'MM/dd/yyyy');
      const docNumber = type === 'quotes' ? record.quote_number : record.invoice_number;
      const customerName = record.customer?.name || 'Unknown Customer';
      const total = record.total_amount || 0;
      const dueDate = record.due_date ? format(new Date(record.due_date), 'MM/dd/yyyy') : '';

      if (type === 'quotes') {
        // Estimate format for quotes
        lines.push(`ESTIMATES\t${date}\t${docNumber}\t${customerName}\t\t${total}\t${record.notes || ''}\t\tN\t\t\t${record.expiration_date ? format(new Date(record.expiration_date), 'MM/dd/yyyy') : ''}\tN\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t`);
      } else {
        // Invoice transaction
        lines.push(`TRNS\tINVOICE\t${date}\tAccounts Receivable\t${customerName}\t\t${total}\t${docNumber}\t${record.notes || ''}\tN\tN\t\t\t\t\t\t${dueDate}\t\t\t\t\t\t\t1\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tN\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t`);
        
        // Add line items if enabled for invoices
        if (type === 'invoices') {
          if (filters.includeLineItems && record.invoice_items) {
            const items = record.invoice_items;
            items.forEach((item: any) => {
              lines.push(`SPL\t${index}\tINVOICE\t${date}\tIncome\t${customerName}\t\t${item.line_total || 0}\t${docNumber}\t${item.description || item.product_name}\tN\t${item.quantity || 1}\t${item.unit_price || 0}\t${item.product_name}\t\tY\t\t\t\t\t\t\t\t\t\t\t\t`);
            });
          } else {
            // Single line item for total
            lines.push(`SPL\t${index}\tINVOICE\t${date}\tIncome\t${customerName}\t\t${total}\t${docNumber}\tServices\tN\t1\t${total}\tServices\t\tY\t\t\t\t\t\t\t\t\t\t\t\t`);
          }
        }
      }
    });

    return lines.join('\n');
  };

  const downloadIIF = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    exportMutation.mutate(filters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      status: 'all',
      includeLineItems: true,
      includeCustomerInfo: true
    });
  };

  const title = type === 'quotes' ? 'Export Quotes to QuickBooks' : 'Export Invoices to QuickBooks';
  const description = type === 'quotes' 
    ? 'Export quotes as estimates to QuickBooks in IIF format for easy import.'
    : 'Export invoices to QuickBooks in IIF format for seamless accounting integration.';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Date Range (Optional)</Label>
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
            <Label className="text-sm font-medium">Status Filter</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {type === 'quotes' ? (
                  <>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Options</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-customer-info"
                  checked={filters.includeCustomerInfo}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeCustomerInfo: !!checked }))}
                />
                <Label htmlFor="include-customer-info" className="text-sm font-normal">
                  Include customer information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-line-items"
                  checked={filters.includeLineItems}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, includeLineItems: !!checked }))}
                />
                <Label htmlFor="include-line-items" className="text-sm font-normal">
                  Include detailed line items
                </Label>
              </div>
            </div>
          </div>

          {/* QuickBooks Import Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">QuickBooks Import Instructions:</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p>1. Open QuickBooks and go to File → Utilities → Import → IIF Files</p>
              <p>2. Select the downloaded .iif file</p>
              <p>3. Review the import summary and click Import</p>
              <p>4. Your {type} will appear in QuickBooks as {type === 'quotes' ? 'estimates' : 'invoices'}</p>
            </div>
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
                <span className="font-medium">Format:</span> QuickBooks IIF File
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
            className="bg-gradient-to-r from-green-600 to-green-700 text-white font-bold border-0 hover:from-green-700 hover:to-green-800"
          >
            {exportMutation.isPending ? (
              "Exporting..."
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export to QuickBooks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}