import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, Link, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface DocumentCardProps {
  document: {
    id: string;
    vehicle_id: string;
    vehicle_name?: string;
    document_type: string;
    document_name: string;
    category: string;
    file_name: string;
    file_size?: number;
    upload_date?: string;
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
  onView?: (document: any) => void;
  onDownload?: (document: any) => void;
  onDelete?: (document: any) => void;
  onLink?: (document: any) => void;
}

export function DocumentCard({ document, categoryInfo, onView, onDownload, onDelete, onLink }: DocumentCardProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(1)} KB` : `${mb.toFixed(1)} MB`;
  };

  const getFileTypeIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return '📄';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      case 'doc':
      case 'docx':
        return '📝';
      default:
        return '📄';
    }
  };

  return (
    <Card className="p-4 hover:shadow-lg transition-all duration-200 border-l-4" 
          style={{ borderLeftColor: categoryInfo.color }}>
      <div className="space-y-4 h-full flex flex-col">
        {/* Header with badge and file type */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2 min-w-0 flex-1">
            <span className="text-xl">{getFileTypeIcon(document.file_name)}</span>
            <Badge 
              variant="secondary" 
              className="text-xs font-medium"
              style={{ 
                backgroundColor: categoryInfo.color + '20',
                color: categoryInfo.color,
                borderColor: categoryInfo.color + '40'
              }}
            >
              {document.category}
            </Badge>
          </div>
          {document.upload_date && (
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 mr-1" />
              {format(new Date(document.upload_date), 'MMM d, yyyy')}
            </div>
          )}
        </div>

        {/* Document Details */}
        <div className="space-y-2 flex-1">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {document.document_name}
          </h3>
          
          {/* Vehicle Info */}
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium">Vehicle:</span>
              <span className="truncate">{document.vehicle_id}</span>
            </div>
            {document.vehicle_name && (
              <div className="text-xs text-muted-foreground truncate">
                {document.vehicle_name}
              </div>
            )}
          </div>
          
          {/* Document Number */}
          {document.document_number && (
            <div className="text-sm">
              <span className="text-gray-500">Doc #:</span>
              <span className="font-medium ml-1 truncate">{document.document_number}</span>
            </div>
          )}
          
          {/* File Info */}
          <div className="text-sm space-y-1">
            <div className="font-medium truncate text-gray-700" title={document.file_name}>
              {document.file_name}
            </div>
            <div className="text-gray-500 text-xs">
              {formatFileSize(document.file_size)}
            </div>
          </div>

          {/* Notes Preview */}
          {document.notes && (
            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded truncate">
              {document.notes}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 min-w-0"
            onClick={() => onView?.(document)}
          >
            <Eye className="w-3 h-3 mr-1" />
            View
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 min-w-0"
            onClick={() => onDownload?.(document)}
          >
            <Download className="w-3 h-3 mr-1" />
            Download
          </Button>
          {onLink && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 min-w-0"
              onClick={() => onLink(document)}
            >
              <Link className="w-3 h-3 mr-1" />
              Link
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete?.(document)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
}