import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, Hash, StickyNote } from "lucide-react";
import { format } from "date-fns";

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
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Document Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
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
