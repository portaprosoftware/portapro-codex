
import React, { useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Download, Trash2, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { DocumentCard } from './DocumentCard';
import { useOrganizationId } from '@/hooks/useOrganizationId';

interface CustomerDocumentsTabProps {
  customerId: string;
}

type DocRow = {
  id: string;
  customer_id: string;
  document_type: string;
  document_name: string;
  file_url: string | null;
  file_size: number | null;
  created_at: string;
  updated_at: string;
};

export const CustomerDocumentsTab: React.FC<CustomerDocumentsTabProps> = ({ customerId }) => {
  const { toast } = useToast();
  const { canViewCustomerDocs, userId } = useUserRole();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const { orgId } = useOrganizationId();

  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>('contract');
  const [docName, setDocName] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const docsQuery = useQuery({
    queryKey: ['customer-documents', customerId, orgId],
    queryFn: async () => {
      if (!orgId) return [];
      
      const { data, error } = await (supabase as any)
        .from('customer_contracts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false});
        
      if (error) throw error;
      return (data || []) as DocRow[];
    },
    enabled: !!orgId,
  });
  const docs = (docsQuery.data || []) as DocRow[];
  const isLoading = docsQuery.isLoading;

  const sanitizedFileName = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, '_');

  const onUpload = async (file: File) => {
    if (!orgId) {
      toast({ title: 'Error', description: 'Organization ID required', variant: 'destructive' });
      return;
    }
    
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing Clerk session token');

      const ts = Date.now();
      const path = `${customerId}/${ts}_${sanitizedFileName(file.name)}`;

      const { data: signedUploadRes, error: fnError } = await supabase.functions.invoke('customer-docs', {
        body: { action: 'create_signed_upload', payload: { path }, organizationId: orgId },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnError) throw fnError;
      const { token: uploadToken } = signedUploadRes?.data || {};

      if (!uploadToken) throw new Error('Failed to get signed upload token');

      const { error: uploadError } = await supabase.storage
        .from('customer-documents')
        .uploadToSignedUrl(path, uploadToken, file);

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('customer_contracts').insert({
        customer_id: customerId,
        document_type: docType || 'contract',
        document_name: docName || file.name,
        file_url: path,
        file_size: file.size,
        uploaded_by: userId,
        organization_id: orgId,
      } as any);
      if (insertError) throw insertError;

      toast({ title: 'Uploaded', description: 'Document uploaded successfully.' });
      setDocName('');
      setSelectedFile(null);
      setUploadDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['customer-documents', customerId] });
    } catch (e: any) {
      console.error('Customer document upload error:', e);
      toast({ title: 'Upload failed', description: e.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const downloadMutation = useMutation({
    mutationFn: async (path: string) => {
      const token = await getToken();
      if (!token) throw new Error('Missing Clerk session token');

      const { data, error } = await supabase.functions.invoke('customer-docs', {
        body: { action: 'create_signed_url', payload: { path, expiresIn: 600 } },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      const signedUrl: string | undefined = data?.data?.signedUrl;
      if (!signedUrl) throw new Error('Failed to generate download link');
      return signedUrl;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (err: any) => {
      toast({ title: 'Download failed', description: err.message || 'Please try again.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: DocRow) => {
      if (!row.file_url) {
        // Still delete the DB row if path is missing
        const { error: delErr } = await supabase.from('customer_contracts').delete().eq('id', row.id);
        if (delErr) throw delErr;
        return;
      }
      const token = await getToken();
      if (!token) throw new Error('Missing Clerk session token');

      const { error: fnErr } = await supabase.functions.invoke('customer-docs', {
        body: { action: 'delete_object', payload: { path: row.file_url } },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (fnErr) throw fnErr;

      const { error: delErr } = await supabase.from('customer_contracts').delete().eq('id', row.id);
      if (delErr) throw delErr;
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Document removed.' });
      queryClient.invalidateQueries({ queryKey: ['customer-documents', customerId] });
    },
    onError: (err: any) => {
      toast({ title: 'Delete failed', description: err.message || 'Please try again.', variant: 'destructive' });
    },
  });

  const totalSize = useMemo(() => {
    return (docs || []).reduce((sum, d) => sum + (Number(d.file_size) || 0), 0);
  }, [docs]);

  return (
    <div className="space-y-6 overflow-x-hidden px-4 lg:px-0">
      <Card className="bg-card rounded-2xl shadow-sm border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Customer Documents</CardTitle>
              <div className="text-sm text-muted-foreground break-words mt-1">
                Total files: {(docs || []).length} • Size: {(totalSize / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
            {canViewCustomerDocs && (
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="doc-type">Document Type</Label>
                      <Select value={docType} onValueChange={setDocType}>
                        <SelectTrigger id="doc-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="signed_document">Signed Document</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="doc-name">Document Name (optional)</Label>
                      <Input
                        id="doc-name"
                        placeholder="e.g., Master Services Agreement"
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-3">
                      <input
                        ref={fileRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setSelectedFile(f);
                          }
                        }}
                        disabled={uploading}
                      />
                      
                      {selectedFile ? (
                        <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/50">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedFile(null);
                              if (fileRef.current) fileRef.current.value = '';
                            }}
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          disabled={uploading}
                          variant="outline"
                          className="w-full"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Choose File
                        </Button>
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        Supported: PDF, JPG, PNG, DOC, DOCX (max ~10MB recommended)
                      </p>

                      <Button
                        onClick={() => selectedFile && onUpload(selectedFile)}
                        disabled={uploading || !selectedFile}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {uploading ? 'Uploading...' : 'Upload Document'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse bg-muted rounded-xl" />
              ))}
            </div>
          ) : (docs || []).length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No Documents</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Upload your first document to get started
              </p>
              {canViewCustomerDocs && (
                <Button
                  onClick={() => setUploadDialogOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {(docs || []).map((d) => (
                <DocumentCard
                  key={d.id}
                  document={d}
                  onDownload={() => d.file_url && downloadMutation.mutate(d.file_url)}
                  onDelete={() => deleteMutation.mutate(d)}
                  canDelete={canViewCustomerDocs}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
