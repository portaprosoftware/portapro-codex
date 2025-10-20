import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, MoreVertical, Download, Trash2, Eye, Edit, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface DocumentCardProps {
  document: {
    id: string;
    document_name: string;
    document_type: string;
    file_size: number | null;
    file_url: string | null;
    created_at: string;
  };
  onDownload: () => void;
  onDelete: () => void;
  canDelete: boolean;
}

export function DocumentCard({ document, onDownload, onDelete, canDelete }: DocumentCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1024px)');

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    const fileName = document.document_name?.toLowerCase() || '';
    const fileUrl = document.file_url?.toLowerCase() || '';
    
    if (fileName.includes('.pdf') || fileUrl.includes('.pdf')) {
      return <FileText className="h-4 w-4 text-red-600" />;
    }
    if (fileName.match(/\.(jpg|jpeg|png|gif|webp)/) || fileUrl.match(/\.(jpg|jpeg|png|gif|webp)/)) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    }
    if (fileName.match(/\.(doc|docx)/) || fileUrl.match(/\.(doc|docx)/)) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-600" />;
  };

  const handleDelete = () => {
    setShowDeleteAlert(false);
    setSheetOpen(false);
    onDelete();
  };

  const handleDownload = () => {
    setSheetOpen(false);
    onDownload();
  };

  const ActionMenu = () => (
    <>
      <div className="flex flex-col gap-1">
        {document.file_url && (
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base font-normal"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-3" />
            Download
          </Button>
        )}
        {canDelete && (
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-base font-normal text-destructive hover:text-destructive"
            onClick={() => {
              setShowDeleteAlert(true);
            }}
          >
            <Trash2 className="w-5 h-5 mr-3" />
            Delete
          </Button>
        )}
      </div>
    </>
  );

  return (
    <>
      <Card className="p-4 sm:p-5 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Icon + Info */}
          <div className="flex items-start gap-3 min-w-0 flex-1">
            <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
              {getFileIcon()}
            </div>
            <div className="min-w-0 flex-1">
              {/* File name */}
              <h4 className="font-semibold text-base line-clamp-2 break-words mb-1">
                {document.document_name || 'Untitled document'}
              </h4>
              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                <span className="capitalize">{document.document_type || 'document'}</span>
                <span>•</span>
                <span>{formatFileSize(document.file_size)}</span>
                <span>•</span>
                <span>{format(new Date(document.created_at), 'MMM d, yyyy, h:mm a')}</span>
              </div>
            </div>
          </div>

          {/* Right: Kebab Menu */}
          <div className="flex-shrink-0">
            {isMobile ? (
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label={`Open actions for ${document.document_name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle className="text-left">Document Actions</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <ActionMenu />
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                    aria-label={`Open actions for ${document.document_name}`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {document.file_url && (
                    <DropdownMenuItem onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                  )}
                  {canDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setShowDeleteAlert(true)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {document.document_name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The document will be permanently deleted from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
