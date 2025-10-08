import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, Hash, StickyNote, Download, ExternalLink, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@clerk/clerk-react";
import { useToast } from "@/hooks/use-toast";

interface DocumentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: {
    id: string;
    vehicle_id: string;
    vehicle_name?: string;
    vehicle_plate?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_nickname?: string;
    document_type: string;
    document_name: string;
    category: string;
    file_name: string;
    file_size?: number;
    upload_date?: string;
    expiration_date?: string;
    document_number?: string;
    notes?: string;
    file_path?: string;
  };
  categoryInfo: {
    name: string;
    icon: string;
    color: string;
    description: string;
  };
}

export function DocumentViewModal({ isOpen, onClose, document, categoryInfo }: DocumentViewModalProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const { getToken } = useAuth();
  const { toast } = useToast();

  // Get file type from filename
  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '')) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const fileType = getFileType(document.file_name);

  // Fetch signed URL when modal opens
  useEffect(() => {
    const fetchSignedUrl = async () => {
      if (!isOpen || !document.file_path) return;

      setIsLoadingUrl(true);
      try {
        const token = await getToken();
        const { data, error } = await supabase.functions.invoke('fleet-docs', {
          body: {
            action: 'create_signed_url',
            payload: { path: document.file_path, expiresIn: 3600 },
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (error || !data?.success) {
          throw new Error((data as any)?.error || (error as any)?.message || 'Failed to load document');
        }

        setSignedUrl((data as any).data.signedUrl);
      } catch (error: any) {
        console.error('Error loading document:', error);
        toast({
          title: "Failed to load document",
          description: error.message || "Could not load the document preview.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingUrl(false);
      }
    };

    fetchSignedUrl();
  }, [isOpen, document.file_path, getToken, toast]);

  const handleDownload = async () => {
    if (!signedUrl) return;

    try {
      const a = window.document.createElement('a');
      a.href = signedUrl;
      a.download = document.file_name;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);

      toast({
        title: "Download Started",
        description: `${document.file_name} is downloading.`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Could not download the document.",
        variant: "destructive",
      });
    }
  };

  const handleOpenInNewTab = () => {
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Document Preview</DialogTitle>
            <div className="flex items-center gap-2">
              {signedUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenInNewTab}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6">
          {/* File Preview Section */}
          <div className="bg-gray-50 rounded-lg p-4 min-h-[400px] flex items-center justify-center">
            {isLoadingUrl ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading document...</p>
              </div>
            ) : !signedUrl ? (
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Unable to load document preview</p>
              </div>
            ) : fileType === 'image' ? (
              <img 
                src={signedUrl} 
                alt={document.document_name}
                className="max-w-full max-h-[600px] object-contain rounded"
              />
            ) : fileType === 'pdf' ? (
              <iframe
                src={signedUrl}
                className="w-full h-[600px] rounded border"
                title={document.document_name}
              />
            ) : (
              <div className="text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">{document.file_name}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Preview not available for this file type
                </p>
                <Button onClick={handleDownload} size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Download to View
                </Button>
              </div>
            )}
          </div>
          {/* Document Title & Category */}
          <div>
            <h3 className="text-lg font-semibold mb-2">{document.document_name}</h3>
            <Badge 
              className="font-bold text-white border-0"
              style={{ background: categoryInfo.color }}
            >
              {document.category}
            </Badge>
          </div>

          {/* Vehicle Information */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h4 className="font-semibold text-sm text-gray-700 mb-3">Vehicle Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-600">Vehicle:</span>
                <p className="font-medium">
                  {document.vehicle_make && document.vehicle_model ? (
                    <>
                      {document.vehicle_make} {document.vehicle_model}
                      {document.vehicle_nickname && ` - ${document.vehicle_nickname}`}
                    </>
                  ) : (
                    document.vehicle_plate || document.vehicle_id
                  )}
                </p>
              </div>
              {document.vehicle_plate && (
                <div>
                  <span className="text-gray-600">License Plate:</span>
                  <p className="font-medium text-blue-600">{document.vehicle_plate}</p>
                </div>
              )}
            </div>
          </div>

          {/* Document Details */}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-gray-700">Document Details</h4>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              {document.upload_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-600 block">Upload Date</span>
                    <p className="font-medium">{format(new Date(document.upload_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}

              {document.expiration_date && (
                <div className="flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-600 block">Expiration Date</span>
                    <p className="font-medium">{format(new Date(document.expiration_date), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              )}

              {document.document_number && (
                <div className="flex items-start gap-2">
                  <Hash className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div>
                    <span className="text-gray-600 block">Document Number</span>
                    <p className="font-medium">{document.document_number}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="text-gray-600 block">File Name</span>
                  <p className="font-medium truncate">{document.file_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
                <div>
                  <span className="text-gray-600 block">File Size</span>
                  <p className="font-medium">{formatFileSize(document.file_size)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {document.notes && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 text-gray-500 mt-0.5" />
                <div className="flex-1">
                  <span className="text-gray-600 text-sm block mb-1">Notes</span>
                  <p className="text-sm">{document.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
