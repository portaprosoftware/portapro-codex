import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, CheckCircle, AlertCircle, Info } from "lucide-react";
import { downloadCSVTemplate, parseCSVFile, importCustomersFromCSV, CustomerCSVRow } from "@/lib/csvUtils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'instructions' | 'upload' | 'processing' | 'results'>('instructions');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CustomerCSVRow[]>([]);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const queryClient = useQueryClient();

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
    toast.success("CSV template downloaded successfully!");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      const data = await parseCSVFile(selectedFile);
      setParsedData(data);
      setProgress(100);
      setStep('upload');
      toast.success(`Parsed ${data.length} customers from CSV file`);
    } catch (error) {
      toast.error(`Failed to parse CSV: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setIsProcessing(true);
    setStep('processing');
    setProgress(0);

    try {
      const results = await importCustomersFromCSV(parsedData);
      setImportResults(results);
      setStep('results');
      
      // Refresh customer data
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      if (results.success > 0) {
        toast.success(`Successfully imported ${results.success} customers`);
      }
      if (results.failed > 0) {
        toast.error(`Failed to import ${results.failed} customers`);
      }
    } catch (error) {
      toast.error(`Import failed: ${(error as Error).message}`);
      setStep('upload');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const resetModal = () => {
    setStep('instructions');
    setSelectedFile(null);
    setParsedData([]);
    setImportResults(null);
    setIsProcessing(false);
    setProgress(0);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Customers from CSV
          </DialogTitle>
        </DialogHeader>

        {step === 'instructions' && (
          <div className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Import customers with their complete profile data including service locations, GPS coordinates, and contacts.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">Step 1: Download Template</h3>
              <p className="text-sm text-gray-600">
                Download our CSV template that includes all available fields and example data.
              </p>
              <Button onClick={handleDownloadTemplate} className="w-full" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download CSV Template
              </Button>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Step 2: Prepare Your Data</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Fill in the template with your customer data</p>
                <p>• Remove the instruction rows that start with #</p>
                <p>• Required fields: name, and either phone or email</p>
                <p>• GPS coordinates should be in decimal format (e.g., 40.7128, -74.0060)</p>
                <p>• Boolean fields (is_default, is_primary) should be "true" or "false"</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Step 3: Upload Your File</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="mb-4"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mb-4">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <Button 
                  onClick={handleParseFile} 
                  disabled={!selectedFile || isProcessing}
                  className="w-full"
                >
                  {isProcessing ? 'Parsing...' : 'Parse CSV File'}
                </Button>
                {isProcessing && <Progress value={progress} className="mt-4" />}
              </div>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="space-y-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Successfully parsed {parsedData.length} customers from your CSV file.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <h3 className="font-semibold">Preview Data</h3>
              <div className="bg-gray-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                {parsedData.slice(0, 3).map((customer, index) => (
                  <div key={index} className="text-sm mb-2">
                    <strong>{customer.name}</strong> - {customer.customer_type} - {customer.phone || customer.email}
                  </div>
                ))}
                {parsedData.length > 3 && (
                  <div className="text-sm text-gray-500">
                    ...and {parsedData.length - 3} more customers
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <Button onClick={() => setStep('instructions')} variant="outline" className="flex-1">
                Back
              </Button>
              <Button onClick={handleImport} className="flex-1">
                Import {parsedData.length} Customers
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <Upload className="w-12 h-12 mx-auto text-blue-500 animate-pulse" />
              <h3 className="font-semibold">Importing Customers...</h3>
              <p className="text-sm text-gray-600">
                Please wait while we import your customer data. This may take a few moments.
              </p>
              <Progress value={progress} className="max-w-md mx-auto" />
            </div>
          </div>
        )}

        {step === 'results' && importResults && (
          <div className="space-y-6">
            <div className="text-center">
              {importResults.success > 0 ? (
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
              ) : (
                <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
              )}
              <h3 className="font-semibold text-lg">Import Complete</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{importResults.success}</div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {importResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Errors:</h4>
                <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-700 mb-1">
                      {error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};