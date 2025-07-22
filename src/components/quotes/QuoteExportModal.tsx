import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { FileText, File, FileSpreadsheet } from 'lucide-react';

interface QuoteExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  isQuickBooks?: boolean;
}

export const QuoteExportModal: React.FC<QuoteExportModalProps> = ({ 
  isOpen, 
  onClose, 
  isQuickBooks = false 
}) => {
  const [format, setFormat] = useState(isQuickBooks ? 'iif' : 'csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleExport = () => {
    console.log('Exporting quotes:', { format, startDate, endDate });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground">
            {isQuickBooks ? 'Export Quotes to QuickBooks' : 'Export Quotes'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Export Format</Label>
            <RadioGroup value={format} onValueChange={setFormat}>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="csv" id="csv" />
                <FileText className="h-5 w-5 text-green-600" />
                <Label htmlFor="csv" className="text-sm text-foreground cursor-pointer">
                  CSV – Compatible with Excel and most spreadsheet applications
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="iif" id="iif" />
                <File className="h-5 w-5 text-blue-800" />
                <Label htmlFor="iif" className="text-sm text-foreground cursor-pointer">
                  IIF (QuickBooks Import Format)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="excel" id="excel" />
                <FileSpreadsheet className="h-5 w-5 text-orange-600" />
                <Label htmlFor="excel" className="text-sm text-foreground cursor-pointer">
                  Excel (.xlsx)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-foreground">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-3">
              <Input
                type="date"
                placeholder="Start date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-border"
              />
              <Input
                type="date"
                placeholder="End date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-border"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              Total quotes: 9 • Total value: $58,469.00 • Date range: All time
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isQuickBooks ? 'Export Quotes' : `Export ${format.toUpperCase()}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};