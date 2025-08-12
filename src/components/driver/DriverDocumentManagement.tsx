import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  FileText, Upload, Download, Eye, Trash2, 
  Plus, Calendar, AlertTriangle, CheckCircle,
  Image, FileIcon, ExternalLink
} from 'lucide-react';

const documentSchema = z.object({
  document_type: z.string().min(1, "Document type is required"),
  file_name: z.string().min(1, "File name is required"),
  file_url: z.string().min(1, "File URL is required"),
  expiry_date: z.string().optional(),
  notes: z.string().optional(),
});

type DocumentFormData = z.infer<typeof documentSchema>;

interface DriverDocumentManagementProps {
  driverId: string;
}

const DOCUMENT_TYPES = [
  'Driver License',
  'Medical Certificate',
  'Training Certificate', 
  'Insurance Card',
  'Emergency Contact',
  'Background Check',
  'Drug Test Results',
  'Equipment Qualification',
  'Safety Training',
  'Other'
];

// Mock document storage (in real app, this would be in Supabase)
interface Document {
  id: string;
  driver_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  expiry_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export function DriverDocumentManagement({ driverId }: DriverDocumentManagementProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  // Mock data - in real app, this would query Supabase
  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['driver-documents', driverId],
    queryFn: async () => {
      // Mock documents for now
      return [
        {
          id: '1',
          driver_id: driverId,
          document_type: 'Driver License',
          file_name: 'driver_license.pdf',
          file_url: '/mock/driver_license.pdf',
          expiry_date: '2025-12-31',
          notes: 'Class A Commercial License',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: '2', 
          driver_id: driverId,
          document_type: 'Medical Certificate',
          file_name: 'medical_cert.pdf',
          file_url: '/mock/medical_cert.pdf',
          expiry_date: '2024-06-30',
          notes: 'DOT Physical Examination',
          created_at: '2024-01-10T09:00:00Z',
          updated_at: '2024-01-10T09:00:00Z'
        }
      ] as Document[];
    }
  });

  const form = useForm<DocumentFormData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      document_type: '',
      file_name: '',
      file_url: '',
      expiry_date: '',
      notes: '',
    }
  });

  const addDocument = useMutation({
    mutationFn: async (data: DocumentFormData) => {
      // In real app, this would save to Supabase
      console.log('Adding document:', data);
      return { id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast.success('Document added successfully');
      setIsAddModalOpen(false);
      setSelectedFile(null);
      form.reset();
    },
    onError: (error) => {
      toast.error('Failed to add document');
      console.error('Error adding document:', error);
    }
  });

  const deleteDocument = useMutation({
    mutationFn: async (documentId: string) => {
      // In real app, this would delete from Supabase and storage
      console.log('Deleting document:', documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-documents', driverId] });
      toast.success('Document deleted');
    },
    onError: (error) => {
      toast.error('Failed to delete document');
      console.error('Error deleting document:', error);
    }
  });

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    form.setValue('file_name', file.name);
    
    // In real app, upload to Supabase storage
    setUploading(true);
    try {
      // Mock upload
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockUrl = `/documents/${driverId}/${file.name}`;
      form.setValue('file_url', mockUrl);
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = (data: DocumentFormData) => {
    addDocument.mutate(data);
  };

  const getDocumentIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <Image className="w-5 h-5 text-blue-600" />;
      default:
        return <FileIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiry < now) return 'expired';
    if (expiry <= thirtyDaysFromNow) return 'expiring_soon';
    return 'valid';
  };

  const getExpiryBadge = (status: string | null) => {
    switch (status) {
      case 'expired':
        return (
          <Badge variant="destructive">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Expired
          </Badge>
        );
      case 'expiring_soon':
        return (
          <Badge variant="destructive" className="bg-orange-500">
            <Calendar className="w-3 h-3 mr-1" />
            Expiring Soon
          </Badge>
        );
      case 'valid':
        return (
          <Badge variant="default">
            <CheckCircle className="w-3 h-3 mr-1" />
            Valid
          </Badge>
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Documents</span>
              <Badge variant="secondary">{documents.length} Files</Badge>
            </CardTitle>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Document
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add New Document</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="document_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {DOCUMENT_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormLabel>File Upload</FormLabel>
                      <div className="mt-2 space-y-3">
                        <div className="flex items-center justify-center w-full">
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-4 text-gray-500" />
                              <p className="mb-2 text-sm text-gray-500">
                                <span className="font-semibold">Click to upload</span> or drag and drop
                              </p>
                              <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={handleFileSelect}
                              disabled={uploading}
                            />
                          </label>
                        </div>
                        
                        {selectedFile && (
                          <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
                            {getDocumentIcon(selectedFile.name)}
                            <span className="text-sm font-medium">{selectedFile.name}</span>
                            {uploading && <span className="text-xs text-gray-600">Uploading...</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="expiry_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Expiry Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Additional notes about this document..." 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={addDocument.isPending || uploading || !selectedFile}
                      >
                        {addDocument.isPending ? "Adding..." : "Add Document"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length > 0 ? (
            <div className="space-y-4">
              {documents.map((document) => {
                const expiryStatus = getExpiryStatus(document.expiry_date);
                return (
                  <div key={document.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getDocumentIcon(document.file_name)}
                        <div>
                          <h4 className="font-semibold text-gray-900">{document.document_type}</h4>
                          <p className="text-sm text-gray-600">{document.file_name}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {expiryStatus && getExpiryBadge(expiryStatus)}
                        
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => deleteDocument.mutate(document.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-600">Uploaded:</span>
                        <p>{new Date(document.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      {document.expiry_date && (
                        <div>
                          <span className="font-medium text-gray-600">Expires:</span>
                          <p>{new Date(document.expiry_date).toLocaleDateString()}</p>
                        </div>
                      )}
                      
                      <div>
                        <span className="font-medium text-gray-600">Size:</span>
                        <p>245 KB</p> {/* Mock size */}
                      </div>
                    </div>
                    
                    {document.notes && (
                      <div className="text-sm">
                        <span className="font-medium text-gray-600">Notes:</span>
                        <p className="text-gray-700 mt-1">{document.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No documents uploaded</p>
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Document
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}