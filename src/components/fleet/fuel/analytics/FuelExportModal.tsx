import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download, FileText, FileSpreadsheet } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface FuelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onExport: (format: 'csv' | 'pdf', dataType: string) => void;
  dataCount: {
    transactions?: number;
    vendors?: number;
    vehicles?: number;
    sources?: number;
    alerts?: number;
  };
}

export const FuelExportModal: React.FC<FuelExportModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onExport,
  dataCount,
}) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [dataType, setDataType] = useState<string>('transactions');

  const getDataTypeOptions = () => {
    switch (activeTab) {
      case 'overview':
        return [
          { value: 'transactions', label: 'All Fuel Transactions', count: dataCount.transactions },
          { value: 'summary', label: 'Analytics Summary', count: 4 },
          { value: 'sources', label: 'Source Comparison', count: dataCount.sources },
        ];
      case 'performance':
        return [
          { value: 'vendors', label: 'Vendor Performance Rankings', count: dataCount.vendors },
          { value: 'cost-per-mile', label: 'Cost Per Mile by Vehicle', count: dataCount.vehicles },
          { value: 'fleet-mpg', label: 'Fleet MPG by Vehicle', count: dataCount.vehicles },
        ];
      case 'compliance':
        return [
          { value: 'compliance', label: 'Compliance Alerts', count: dataCount.alerts },
        ];
      case 'reports':
        return [
          { value: 'transactions', label: 'All Fuel Transactions', count: dataCount.transactions },
        ];
      default:
        return [];
    }
  };

  const options = getDataTypeOptions();

  // Set initial data type based on active tab
  React.useEffect(() => {
    if (options.length > 0) {
      setDataType(options[0].value);
    }
  }, [activeTab]);

  const handleExport = () => {
    onExport(format, dataType);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Fuel Data
          </DialogTitle>
          <DialogDescription>
            Choose the format and data you want to export
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as 'csv' | 'pdf')}>
              <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium">CSV (Spreadsheet)</div>
                    <div className="text-xs text-muted-foreground">Best for Excel, Google Sheets</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-accent">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex-1 cursor-pointer flex items-center gap-2">
                  <FileText className="h-4 w-4 text-red-600" />
                  <div>
                    <div className="font-medium">PDF (Report)</div>
                    <div className="text-xs text-muted-foreground">Professional formatted report</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Data Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Data to Export</Label>
            <RadioGroup value={dataType} onValueChange={setDataType}>
              {options.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 rounded-lg border p-3 cursor-pointer hover:bg-accent"
                >
                  <RadioGroupItem value={option.value} id={option.value} />
                  <Label
                    htmlFor={option.value}
                    className="flex-1 cursor-pointer flex items-center justify-between"
                  >
                    <span className="font-medium">{option.label}</span>
                    {option.count !== undefined && (
                      <Badge variant="secondary" className="font-bold">
                        {option.count} {option.count === 1 ? 'row' : 'rows'}
                      </Badge>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export {format.toUpperCase()}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
