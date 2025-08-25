import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface ViewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  note: {
    id: string;
    title?: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
    created_at: string;
    updated_at: string;
  } | null;
}

export function ViewNoteModal({ isOpen, onClose, note }: ViewNoteModalProps) {
  if (!note) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <DialogTitle className="flex-1">
              {note.title || 'Customer Note'}
            </DialogTitle>
            {note.is_important && (
              <Badge variant="destructive">
                Important
              </Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">Note Content</h4>
            <div className="p-3 bg-muted/50 rounded-md">
              <p className="text-foreground whitespace-pre-wrap select-text">
                {note.note_text}
              </p>
            </div>
          </div>

          {note.tags && note.tags.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
              <div className="flex flex-wrap gap-1">
                {note.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground space-y-1">
              <div>
                Created: {format(new Date(note.created_at), 'MMM d, yyyy \'at\' h:mm a')}
              </div>
              {note.updated_at !== note.created_at && (
                <div>
                  Updated: {format(new Date(note.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}