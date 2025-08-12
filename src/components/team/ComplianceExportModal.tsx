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

interface ComplianceExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExportFilters {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  status: string;
  documentTypes: string[];
  format: 'csv' | 'pdf';
}

export function ComplianceExportModal({ isOpen, onClose }: ComplianceExportModalProps) {
  const [filters, setFilters] = useState<ExportFilters>({
    dateRange: { from: undefined, to: undefined },
    status: 'all',
    documentTypes: [],
    format: 'csv'
  });
  const { toast } = useToast();

  const documentTypes = [
    { id: 'license', label: 'Driver Licenses' },
    { id: 'medical', label: 'Medical Cards' },
    { id: 'training', label: 'Training Certificates' },
    { id: 'equipment', label: 'Equipment Qualifications' },
    { id: 'safety', label: 'Safety Records' }
  ];

  const exportMutation = useMutation({
    mutationFn: async (exportFilters: ExportFilters) => {
      const { data, error } = await supabase.functions.invoke('export-compliance-data', {
        body: { 
          filters: exportFilters,
          timestamp: new Date().toISOString()
        }
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.downloadUrl) {
        // Create download link
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename || `compliance_export_${format(new Date(), 'yyyy-MM-dd')}.${filters.format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast({
          title: "Export Complete",
          description: `Compliance data exported successfully as ${filters.format.toUpperCase()}.`
        });
      } else {
        // Fallback: create CSV content directly
        const csvContent = generateCSVContent(data.records || []);
        downloadCSV(csvContent, `compliance_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
        
        toast({
          title: "Export Complete",
          description: "Compliance data exported successfully."
        });
      }
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Export Failed",
        description: "Failed to export compliance data. Please try again.",
        variant: "destructive"
      });
      console.error('Export error:', error);
    }
  });

  const generateCSVContent = (records: any[]) => {
    if (records.length === 0) return '';
    
    const headers = Object.keys(records[0]).join(',');
    const rows = records.map(record => 
      Object.values(record).map(value => 
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
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

  const handleDocumentTypeChange = (typeId: string, checked: boolean) => {
    setFilters(prev => ({
      ...prev,
      documentTypes: checked 
        ? [...prev.documentTypes, typeId]
        : prev.documentTypes.filter(id => id !== typeId)
    }));
  };

  const handleExport = () => {
    if (filters.documentTypes.length === 0) {
      toast({
        title: "No Document Types Selected",
        description: "Please select at least one document type to export.",
        variant: "destructive"
      });
      return;
    }

    exportMutation.mutate(filters);
  };

  const resetFilters = () => {
    setFilters({
      dateRange: { from: undefined, to: undefined },
      status: 'all',
      documentTypes: [],
      format: 'csv'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Export Compliance Data
          </DialogTitle>
          <DialogDescription>
            Export driver compliance data for audits and reporting. Select your filters and format below.
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
            <Label className="text-sm font-medium">Compliance Status</Label>
            <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="current">Current/Valid</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="missing">Missing Documents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Types */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Document Types</Label>
            <div className="grid grid-cols-2 gap-3">
              {documentTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={type.id}
                    checked={filters.documentTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleDocumentTypeChange(type.id, !!checked)}
                  />
                  <Label htmlFor={type.id} className="text-sm font-normal">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
            {filters.documentTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.documentTypes.map(typeId => {
                  const type = documentTypes.find(t => t.id === typeId);
                  return (
                    <Badge key={typeId} variant="secondary" className="text-xs">
                      {type?.label}
                    </Badge>
                  );
                })}
              </div>
            )}
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
                <span className="font-medium">Document Types:</span>{' '}
                {filters.documentTypes.length === 0 
                  ? 'None selected' 
                  : `${filters.documentTypes.length} selected`
                }
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
            disabled={filters.documentTypes.length === 0 || exportMutation.isPending}
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