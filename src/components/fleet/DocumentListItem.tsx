import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, Calendar, FileText } from "lucide-react";
import { format } from "date-fns";

interface DocumentListItemProps {
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
}

export function DocumentListItem({ document, categoryInfo, onView, onDownload, onDelete }: DocumentListItemProps) {
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    const kb = bytes / 1024;
    return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-all duration-200">
      {/* Document Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm text-gray-900 truncate">
            {document.document_name}
          </h3>
          <Badge 
            className="font-bold text-white border-0 whitespace-nowrap"
            style={{ 
              background: categoryInfo.color
            }}
          >
            {document.category}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {document.upload_date && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(new Date(document.upload_date), 'MMM d, yyyy')}
            </div>
          )}
          
          <div className="flex items-center gap-1">
            <span className="font-medium">Vehicle:</span>
            <span className="truncate">
              {/* Format: Make Model - Nickname or just Make Model if no nickname */}
              {document.vehicle_make && document.vehicle_model ? (
                <>
                  {document.vehicle_make} {document.vehicle_model}
                  {document.vehicle_nickname && ` - ${document.vehicle_nickname}`}
                </>
              ) : (
                document.vehicle_plate || document.vehicle_id
              )}
            </span>
          </div>

          {/* License Plate */}
          {document.vehicle_plate && (
            <span className="text-blue-600 font-medium">{document.vehicle_plate}</span>
          )}

          {document.document_number && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Doc #:</span>
              <span>{document.document_number}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
          <span className="truncate">{document.file_name}</span>
          <span>{formatFileSize(document.file_size)}</span>
        </div>

        {document.notes && (
          <div className="text-xs text-gray-600 mt-2 truncate">
            {document.notes}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onView?.(document)}
          className="whitespace-nowrap"
        >
          <Eye className="w-4 h-4 mr-1" />
          View
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => onDownload?.(document)}
          className="whitespace-nowrap"
        >
          <Download className="w-4 h-4 mr-1" />
          Download
        </Button>
        <Button 
          variant="ghost" 
          size="sm"
          className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete?.(document)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
