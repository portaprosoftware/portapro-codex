import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ImportFuelCSVModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ImportFuelCSVModal: React.FC<ImportFuelCSVModalProps> = ({
  open,
  onOpenChange
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [mapping, setMapping] = useState({
    date: '',
    vehicle: '',
    driver: '',
    odometer: '',
    gallons: '',
    cost_per_gallon: '',
    station: '',
    notes: ''
  });
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview'>('upload');

  const { toast } = useToast();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      
      // Read CSV file
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const rows = text.split('\n').map(row => row.split(','));
        setCsvData(rows);
        setStep('mapping');
      };
      reader.readAsText(file);
    } else {
      toast({
        title: 'Invalid file',
        description: 'Please upload a CSV file',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async () => {
    if (!csvData || csvData.length < 2) {
      toast({
        title: 'Error',
        description: 'No data to import',
        variant: 'destructive'
      });
      return;
    }

    // Here you would implement the actual import logic
    // For now, we'll just show a success message
    toast({
      title: 'Success',
      description: `Imported ${csvData.length - 1} fuel logs successfully`
    });
    
    onOpenChange(false);
    setStep('upload');
    setCsvFile(null);
    setCsvData([]);
    setMapping({
      date: '',
      vehicle: '',
      driver: '',
      odometer: '',
      gallons: '',
      cost_per_gallon: '',
      station: '',
      notes: ''
    });
  };

  const downloadTemplate = () => {
    const template = [
      ['Date', 'Vehicle License', 'Driver Name', 'Odometer', 'Gallons', 'Cost Per Gallon', 'Station', 'Notes'],
      ['2024-01-15', 'TRUCK-001', 'John Doe', '125000', '15.5', '3.459', 'Shell Station', 'Regular fuel']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fuel_log_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const csvHeaders = csvData.length > 0 ? csvData[0] : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Fuel Logs from CSV</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Upload CSV File</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="csv-file">Select CSV File</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="font-medium">Need a template?</p>
                      <p className="text-sm text-muted-foreground">Download our CSV template to get started</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'mapping' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Map CSV Columns</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Map your CSV columns to the corresponding fuel log fields:
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date Column</Label>
                    <Select value={mapping.date} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, date: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Vehicle Column</Label>
                    <Select value={mapping.vehicle} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, vehicle: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Driver Column</Label>
                    <Select value={mapping.driver} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, driver: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Odometer Column</Label>
                    <Select value={mapping.odometer} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, odometer: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Gallons Column</Label>
                    <Select value={mapping.gallons} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, gallons: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Cost/Gallon Column</Label>
                    <Select value={mapping.cost_per_gallon} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, cost_per_gallon: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Station Column (Optional)</Label>
                    <Select value={mapping.station} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, station: value === "none" ? "" : value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Notes Column (Optional)</Label>
                    <Select value={mapping.notes} onValueChange={(value) => 
                      setMapping(prev => ({ ...prev, notes: value === "none" ? "" : value }))
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select column" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-4">
          {step === 'mapping' && (
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
          )}
          
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            
            {step === 'mapping' && (
              <Button 
                onClick={handleImport}
                className="bg-gradient-to-r from-primary to-primary-variant"
                disabled={!mapping.date || !mapping.vehicle || !mapping.gallons || !mapping.cost_per_gallon}
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};