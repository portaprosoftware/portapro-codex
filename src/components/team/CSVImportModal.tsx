import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useMutation } from '@tanstack/react-query';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedDriver {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  licenseNumber?: string;
  licenseState?: string;
  licenseClass?: string;
  licenseExpiryDate?: string;
  medicalCardExpiryDate?: string;
  trainingType?: string;
  trainingCompletedDate?: string;
}

export function CSVImportModal({ isOpen, onClose, onSuccess }: CSVImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const importMutation = useMutation({
    mutationFn: async (csvData: ParsedDriver[]) => {
      setUploadProgress(0);
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < csvData.length; i += batchSize) {
        batches.push(csvData.slice(i, i + batchSize));
      }

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        // Create profiles first
        const profilesData = batch.map(driver => ({
          first_name: driver.firstName,
          last_name: driver.lastName,
          email: driver.email,
          phone: driver.phone,
          status: 'active'
        }));

        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .insert(profilesData)
          .select('id, email');

        if (profileError) throw profileError;

        // Create user roles
        if (profiles) {
          const rolesData = profiles.map(profile => ({
            user_id: profile.id,
            role: 'driver' as const
          }));

          const { error: roleError } = await supabase
            .from('user_roles')
            .insert(rolesData);

          if (roleError) throw roleError;

          // Create driver credentials if provided
          const credentialsData = batch
            .map((driver, index) => {
              const profile = profiles[index];
              if (!profile || (!driver.licenseNumber && !driver.medicalCardExpiryDate)) {
                return null;
              }
              
              return {
                driver_id: profile.id,
                license_number: driver.licenseNumber,
                license_state: driver.licenseState,
                license_class: driver.licenseClass,
                license_expiry_date: driver.licenseExpiryDate,
                medical_card_expiry_date: driver.medicalCardExpiryDate
              };
            })
            .filter(Boolean);

          if (credentialsData.length > 0) {
            const { error: credentialError } = await supabase
              .from('driver_credentials')
              .insert(credentialsData);

            if (credentialError) throw credentialError;
          }

          // Create training records if provided
          const trainingData = batch
            .map((driver, index) => {
              const profile = profiles[index];
              if (!profile || !driver.trainingType) {
                return null;
              }
              
              return {
                driver_id: profile.id,
                training_type: driver.trainingType,
                last_completed: driver.trainingCompletedDate
              };
            })
            .filter(Boolean);

          if (trainingData.length > 0) {
            const { error: trainingError } = await supabase
              .from('driver_training_records')
              .insert(trainingData);

            if (trainingError) throw trainingError;
          }
        }

        // Update progress
        const progress = ((batchIndex + 1) / batches.length) * 100;
        setUploadProgress(progress);
      }

      return csvData.length;
    },
    onSuccess: (importedCount) => {
      toast({
        title: "Import Successful",
        description: `Successfully imported ${importedCount} drivers.`
      });
      onSuccess();
      onClose();
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Import Failed",
        description: "Failed to import drivers. Please check your data and try again.",
        variant: "destructive"
      });
      console.error('Import error:', error);
    }
  });

  const parseCSV = (csvText: string): ParsedDriver[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    const errors: string[] = [];
    
    const requiredFields = ['firstName', 'lastName', 'email'];
    const missingFields = requiredFields.filter(field => !headers.includes(field));
    
    if (missingFields.length > 0) {
      errors.push(`Missing required columns: ${missingFields.join(', ')}`);
    }

    const data: ParsedDriver[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`);
        continue;
      }

      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index];
      });

      // Validate required fields
      if (!row.firstName || !row.lastName || !row.email) {
        errors.push(`Row ${i + 1}: Missing required fields`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`);
        continue;
      }

      data.push(row as ParsedDriver);
    }

    setValidationErrors(errors);
    return data;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setValidationErrors([]);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a valid CSV file.",
        variant: "destructive"
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsedData = parseCSV(csvText);
      
      if (validationErrors.length > 0) {
        return;
      }

      if (parsedData.length === 0) {
        toast({
          title: "No Valid Data",
          description: "No valid driver records found in the CSV file.",
          variant: "destructive"
        });
        return;
      }

      importMutation.mutate(parsedData);
    };
    reader.readAsText(file);
  };

  const resetForm = () => {
    setFile(null);
    setUploadProgress(0);
    setValidationErrors([]);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Drivers from CSV
          </DialogTitle>
          <DialogDescription>
            Upload a CSV file to import multiple drivers at once. Make sure your file follows the template format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
            <div className="flex flex-col items-center gap-4">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">Choose a CSV file</p>
                <p className="text-xs text-muted-foreground">
                  File should contain driver information following the template format
                </p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-upload"
              />
              <Button asChild variant="outline">
                <label htmlFor="csv-upload" className="cursor-pointer">
                  Select CSV File
                </label>
              </Button>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>
          </div>

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Validation Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Importing drivers...</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress)}%
                </span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            disabled={!file || validationErrors.length > 0 || importMutation.isPending}
          >
            {importMutation.isPending ? (
              "Importing..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Import Drivers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}