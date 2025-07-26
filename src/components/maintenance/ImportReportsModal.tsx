import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { FileDown, Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";

interface ImportReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportReportsModal: React.FC<ImportReportsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const lines = text.split('\n');
      
      // Skip header row
      const dataLines = lines.slice(1).filter(line => line.trim());
      
      const records = dataLines.map((line, index) => {
        const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
        
        return {
          customer_id: "00000000-0000-0000-0000-000000000000", // Default customer ID
          template_id: "00000000-0000-0000-0000-000000000000", // Default template ID
          status: columns[0] || 'open',
          completion_percentage: parseInt(columns[1]) || 0,
          report_data: {
            customer_name: columns[2] || `Customer ${index + 1}`,
            location: columns[3] || 'Unknown Location',
            service_type: columns[4] || 'General Service',
            service_date: columns[5] || new Date().toISOString().split('T')[0],
            notes: columns[6] || '',
          },
        };
      });

      // Insert records in batches
      const batchSize = 10;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const { error } = await supabase
          .from("maintenance_reports")
          .insert(batch);
        
        if (error) throw error;
        
        // Update progress
        setUploadProgress(((i + batch.length) / records.length) * 100);
      }

      return records.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["maintenance-reports"] });
      toast.success(`Successfully imported ${count} service records`);
      onClose();
      setFile(null);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error("Failed to import records");
      console.error(error);
      setUploadProgress(0);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file) return;
    importMutation.mutate(file);
  };

  const downloadTemplate = () => {
    const csvContent = [
      'Status,Completion %,Customer Name,Location,Service Type,Date,Notes',
      'open,0,"John Doe","123 Main St","Cleaning","2024-01-15","Example cleaning service"',
      'completed,100,"Jane Smith","456 Oak Ave","Maintenance","2024-01-14","Routine maintenance completed"',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'service_records_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Service Records</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                Upload a CSV file to import multiple service records
              </p>
              <Button
                variant="outline"
                onClick={downloadTemplate}
                className="text-blue-600 hover:text-blue-700"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Download Template
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="csv-file">Select CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
          </div>

          {file && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm font-medium">Selected File:</p>
              <p className="text-sm text-gray-600">{file.name}</p>
              <p className="text-xs text-gray-500">Size: {(file.size / 1024).toFixed(1)} KB</p>
            </div>
          )}

          {importMutation.isPending && (
            <div className="space-y-2">
              <Label>Import Progress</Label>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">{uploadProgress.toFixed(0)}% Complete</p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {importMutation.isPending ? "Importing..." : "Import Records"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};