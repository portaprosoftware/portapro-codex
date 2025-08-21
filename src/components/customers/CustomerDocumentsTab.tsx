
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
import { FileText, Download, Trash2, Upload } from 'lucide-react';
import { format } from 'date-fns';

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

  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>('contract');
  const [docName, setDocName] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  const { data: docs, isLoading } = useQuery({
    queryKey: ['customer-documents', customerId],
    queryFn: async (): Promise<DocRow[]> => {
      const { data, error } = await supabase
        .from('customer_contracts')
        .select('id, customer_id, document_type, document_name, file_url, file_size, created_at, updated_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const sanitizedFileName = (name: string) => name.replace(/[^a-zA-Z0-9.-]/g, '_');

  const onUpload = async (file: File) => {
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing Clerk session token');

      const ts = Date.now();
      const path = `${customerId}/${ts}_${sanitizedFileName(file.name)}`;

      const { data: signedUploadRes, error: fnError } = await supabase.functions.invoke('customer-docs', {
        body: { action: 'create_signed_upload', payload: { path } },
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
      } as any);
      if (insertError) throw insertError;

      toast({ title: 'Uploaded', description: 'Document uploaded successfully.' });
      setDocName('');
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
    <div className="space-y-6">
      {canViewCustomerDocs && (
        <Card className="bg-white rounded-2xl shadow-md border">
          <CardHeader>
            <CardTitle className="text-xl">Upload Document</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={docType} onValueChange={setDocType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="signed_document">Signed Document</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Document Name (optional)</Label>
                <Input
                  placeholder="e.g., Master Services Agreement"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onUpload(f);
                }}
                disabled={uploading}
              />
              <Button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose File & Upload'}
              </Button>
              <div className="text-sm text-muted-foreground">
                Supported: PDF, JPG, PNG, DOC, DOCX (max ~10MB recommended)
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white rounded-2xl shadow-md border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Customer Documents</CardTitle>
            <div className="text-sm text-muted-foreground">
              Total files: {(docs || []).length} • Size: {(totalSize / (1024 * 1024)).toFixed(1)} MB
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-24 animate-pulse bg-muted rounded-xl" />
          ) : (docs || []).length === 0 ? (
            <div className="text-sm text-muted-foreground">No documents uploaded yet.</div>
          ) : (
            <div className="space-y-3">
              {(docs || []).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-3 rounded-xl border bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">{d.document_name || 'Untitled document'}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.document_type || 'document'} • {d.file_size ? `${(Number(d.file_size) / 1024).toFixed(0)} KB` : '—'} • {format(new Date(d.created_at), 'PPp')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {d.file_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadMutation.mutate(d.file_url!)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                    )}
                    {canViewCustomerDocs && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(d)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
