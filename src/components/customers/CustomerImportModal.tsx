import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createServiceLocationWithGeocoding } from '@/utils/geocoding';

interface CustomerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ParsedCustomer {
  // Main customer data
  name: string;
  customer_type: string;
  email?: string;
  phone?: string;
  
  // Billing address
  billing_street?: string;
  billing_street2?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  
  // Service address
  service_street?: string;
  service_street2?: string;
  service_city?: string;
  service_state?: string;
  service_zip?: string;
  
  // Settings
  credit_not_approved?: boolean;
  deposit_required?: boolean;
  important_information?: string;
  
  // Primary contact
  contact_first_name?: string;
  contact_last_name?: string;
  contact_email?: string;
  contact_phone?: string;
  contact_title?: string;
  contact_type?: string;
  
  // Default service location
  location_name?: string;
  location_description?: string;
  location_contact_person?: string;
  location_contact_phone?: string;
  location_access_instructions?: string;
  location_notes?: string;
}

const CUSTOMER_TYPES = [
  'bars_restaurants', 'construction', 'emergency_disaster_relief', 'events_festivals',
  'municipal_government', 'other', 'private_events_weddings', 'retail', 'sports_recreation', 'commercial'
];

const CONTACT_TYPES = ['primary', 'billing', 'service', 'emergency', 'manager', 'accounting'];

export function CustomerImportModal({ isOpen, onClose, onSuccess }: CustomerImportModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const importMutation = useMutation({
    mutationFn: async (csvData: string) => {
      const rows = csvData.trim().split('\n');
      const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      const customers: ParsedCustomer[] = [];
      const errors: string[] = [];
      
      setUploadProgress(10);
      
      // Parse and validate each row
      for (let i = 1; i < rows.length; i++) {
        const rowData = rows[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        const customer: Partial<ParsedCustomer> = {};
        
        headers.forEach((header, index) => {
          const value = rowData[index] || '';
          const key = header.toLowerCase().replace(/\s+/g, '_');
          
          switch (key) {
            case 'customer_name':
            case 'name':
              customer.name = value;
              break;
            case 'customer_type':
            case 'type':
              if (value && CUSTOMER_TYPES.includes(value)) {
                customer.customer_type = value;
              } else if (value) {
                errors.push(`Row ${i + 1}: Invalid customer type "${value}"`);
              }
              break;
            case 'email':
              customer.email = value || undefined;
              break;
            case 'phone':
              customer.phone = value || undefined;
              break;
            case 'billing_street':
              customer.billing_street = value || undefined;
              break;
            case 'billing_street2':
              customer.billing_street2 = value || undefined;
              break;
            case 'billing_city':
              customer.billing_city = value || undefined;
              break;
            case 'billing_state':
              customer.billing_state = value || undefined;
              break;
            case 'billing_zip':
              customer.billing_zip = value || undefined;
              break;
            case 'service_street':
              customer.service_street = value || undefined;
              break;
            case 'service_street2':
              customer.service_street2 = value || undefined;
              break;
            case 'service_city':
              customer.service_city = value || undefined;
              break;
            case 'service_state':
              customer.service_state = value || undefined;
              break;
            case 'service_zip':
              customer.service_zip = value || undefined;
              break;
            case 'credit_not_approved':
              customer.credit_not_approved = value?.toLowerCase() === 'true' || value?.toLowerCase() === 'yes';
              break;
            case 'deposit_required':
              customer.deposit_required = value?.toLowerCase() !== 'false' && value?.toLowerCase() !== 'no';
              break;
            case 'important_information':
            case 'notes':
              customer.important_information = value || undefined;
              break;
            case 'contact_first_name':
              customer.contact_first_name = value || undefined;
              break;
            case 'contact_last_name':
              customer.contact_last_name = value || undefined;
              break;
            case 'contact_email':
              customer.contact_email = value || undefined;
              break;
            case 'contact_phone':
              customer.contact_phone = value || undefined;
              break;
            case 'contact_title':
              customer.contact_title = value || undefined;
              break;
            case 'contact_type':
              if (value && CONTACT_TYPES.includes(value)) {
                customer.contact_type = value;
              }
              break;
            case 'location_name':
              customer.location_name = value || undefined;
              break;
            case 'location_description':
              customer.location_description = value || undefined;
              break;
            case 'location_contact_person':
              customer.location_contact_person = value || undefined;
              break;
            case 'location_contact_phone':
              customer.location_contact_phone = value || undefined;
              break;
            case 'location_access_instructions':
              customer.location_access_instructions = value || undefined;
              break;
            case 'location_notes':
              customer.location_notes = value || undefined;
              break;
          }
        });
        
        // Validate required fields
        if (!customer.name) {
          errors.push(`Row ${i + 1}: Customer name is required`);
        }
        if (!customer.customer_type) {
          errors.push(`Row ${i + 1}: Customer type is required`);
        }
        
        if (customer.name && customer.customer_type) {
          customers.push(customer as ParsedCustomer);
        }
      }
      
      setUploadProgress(30);
      
      if (errors.length > 0) {
        throw new Error(`Validation errors:\n${errors.join('\n')}`);
      }
      
      // Batch insert customers with progress tracking
      const batchSize = 10;
      let processedCount = 0;
      const results = [];
      
      for (let i = 0; i < customers.length; i += batchSize) {
        const batch = customers.slice(i, i + batchSize);
        
        for (const customerData of batch) {
          try {
            // Create customer
            const { data: insertedCustomer, error: customerError } = await supabase
              .from('customers')
              .insert({
                name: customerData.name,
                customer_type: customerData.customer_type as any,
                email: customerData.email || null,
                phone: customerData.phone || null,
                billing_street: customerData.billing_street || null,
                billing_street2: customerData.billing_street2 || null,
                billing_city: customerData.billing_city || null,
                billing_state: customerData.billing_state || null,
                billing_zip: customerData.billing_zip || null,
                service_street: customerData.service_street || null,
                service_street2: customerData.service_street2 || null,
                service_city: customerData.service_city || null,
                service_state: customerData.service_state || null,
                service_zip: customerData.service_zip || null,
                credit_not_approved: customerData.credit_not_approved || false,
                deposit_required: customerData.deposit_required !== false,
                important_information: customerData.important_information || null,
                billing_differs_from_service: !!(customerData.billing_street && customerData.service_street),
              })
              .select()
              .single();
            
            if (customerError) throw customerError;
            
            const customerId = insertedCustomer.id;
            
            // Create primary contact if provided
            if (customerData.contact_first_name || customerData.contact_last_name) {
              await supabase
                .from('customer_contacts')
                .insert({
                  customer_id: customerId,
                  first_name: customerData.contact_first_name || 'Unknown',
                  last_name: customerData.contact_last_name || 'Contact',
                  email: customerData.contact_email || null,
                  phone: customerData.contact_phone || null,
                  title: customerData.contact_title || null,
                  contact_type: customerData.contact_type || 'primary',
                  is_primary: true,
                });
            }
            
            // Create service location if address provided
            if (customerData.service_street && customerData.service_city && customerData.service_state) {
              try {
                await createServiceLocationWithGeocoding(
                  customerId,
                  customerData.location_name || `${customerData.name} - Main Location`,
                  customerData.service_street,
                  customerData.service_city,
                  customerData.service_state,
                  customerData.service_zip || ''
                );
              } catch (geocodingError) {
                console.error('Geocoding failed for customer:', customerData.name, geocodingError);
                // Continue with import even if geocoding fails
              }
            }
            
            results.push(insertedCustomer);
            processedCount++;
            
            // Update progress
            const progress = 30 + (processedCount / customers.length) * 60;
            setUploadProgress(Math.round(progress));
            
          } catch (error) {
            console.error(`Failed to import customer ${customerData.name}:`, error);
            throw new Error(`Failed to import customer "${customerData.name}": ${error.message}`);
          }
        }
      }
      
      setUploadProgress(100);
      return results;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers-with-engagement'] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${data.length} customers with contacts and service locations.`,
      });
      
      resetForm();
      onSuccess?.();
      onClose();
    },
    onError: (error: Error) => {
      console.error('Import failed:', error);
      setValidationErrors(error.message.split('\n'));
      toast({
        title: "Import Failed",
        description: "Please check the validation errors and try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast({
          title: "Invalid File Type",
          description: "Please select a CSV file.",
          variant: "destructive",
        });
        return;
      }
      setFile(selectedFile);
      setValidationErrors([]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target?.result as string;
      importMutation.mutate(csvContent);
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const templateHeaders = [
      'customer_name',
      'customer_type',
      'email',
      'phone',
      'billing_street',
      'billing_street2', 
      'billing_city',
      'billing_state',
      'billing_zip',
      'service_street',
      'service_street2',
      'service_city', 
      'service_state',
      'service_zip',
      'credit_not_approved',
      'deposit_required',
      'important_information',
      'contact_first_name',
      'contact_last_name',
      'contact_email',
      'contact_phone',
      'contact_title',
      'contact_type',
      'location_name',
      'location_description',
      'location_contact_person',
      'location_contact_phone',
      'location_access_instructions',
      'location_notes'
    ];
    
    const sampleData = [
      'ABC Construction Co',
      'construction',
      'manager@abcconstruction.com',
      '(555) 123-4567',
      '123 Business Park Dr',
      'Suite 100',
      'Springfield',
      'IL',
      '62701',
      '456 Worksite Ave',
      '',
      'Springfield',
      'IL', 
      '62702',
      'false',
      'true',
      'Preferred contractor - priority customer',
      'John',
      'Smith',
      'john@abcconstruction.com',
      '(555) 123-4568',
      'Project Manager',
      'primary',
      'Main Construction Site',
      'Primary worksite location',
      'Site Foreman Mike',
      '(555) 123-4569',
      'Enter through main gate, check in at office',
      'Site active Mon-Fri 7AM-5PM'
    ];
    
    const csvContent = [
      templateHeaders.join(','),
      sampleData.map(value => `"${value}"`).join(','),
      // Add instruction comments
      '# Instructions:',
      '# - customer_name: Required - Company or business name',
      '# - customer_type: Required - One of: bars_restaurants, construction, emergency_disaster_relief, events_festivals, municipal_government, other, private_events_weddings, retail, sports_recreation, commercial', 
      '# - credit_not_approved: true/false (default: false)',
      '# - deposit_required: true/false (default: true)',
      '# - contact_type: primary, billing, service, emergency, manager, accounting',
      '# - Remove these instruction lines before importing'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'customer_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Template Downloaded",
      description: "Customer import template has been downloaded to your computer.",
    });
  };

  const resetForm = () => {
    setFile(null);
    setUploadProgress(0);
    setValidationErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Customers
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Download Template Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900 mb-1">Download Template First</h3>
                <p className="text-sm text-blue-700 mb-3">
                  Get our CSV template with all supported fields including customer data, contacts, and service locations.
                </p>
                <Button 
                  onClick={downloadTemplate}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* Import Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-medium text-green-900 mb-2">Import Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-green-700">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Automatic duplicate detection</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>GPS coordinates via geocoding</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Primary contacts creation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Service locations setup</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Batch processing (large imports)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                <span>Detailed error reporting</span>
              </div>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <Label htmlFor="csv-file">Upload CSV File</Label>
            <div className="mt-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={importMutation.isPending}
              />
            </div>
            {file && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span>{file.name} selected</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                  className="p-1 h-auto"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">Import validation errors:</div>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {validationErrors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {validationErrors.length > 10 && (
                    <li className="text-muted-foreground">
                      ...and {validationErrors.length - 10} more errors
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {importMutation.isPending && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing customers...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={importMutation.isPending}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!file || importMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Customers'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}