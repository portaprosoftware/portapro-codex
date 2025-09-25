import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileText } from "lucide-react";

interface DocumentTypeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: {
    name: string;
    description?: string | null;
    category?: string;
    isPredefined: boolean;
  } | null;
  categoryInfo?: {
    name: string;
    icon: string;
    color: string;
    description: string;
  };
}

export const DocumentTypeDetailsModal: React.FC<DocumentTypeDetailsModalProps> = ({
  isOpen,
  onClose,
  documentType,
  categoryInfo
}) => {
  if (!documentType) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Document Type Details
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Category Section */}
          {categoryInfo && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category</label>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-xl">{categoryInfo.icon}</span>
                <div>
                  <div className="font-medium text-gray-900">{categoryInfo.name}</div>
                  <div className="text-sm text-gray-600">{categoryInfo.description}</div>
                </div>
              </div>
            </div>
          )}

          {/* Document Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Document Name</label>
            <div className="text-gray-900">{documentType.name}</div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Description</label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">
                {documentType.description || "No description provided"}
              </p>
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
};