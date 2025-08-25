import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    note_type: 'general' | 'service' | 'communication';
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  }) => void;
  noteType: 'general' | 'service' | 'communication';
  existingNote?: {
    id: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  };
}

export function EditNotesModal({ 
  isOpen, 
  onClose, 
  onSave, 
  noteType, 
  existingNote 
}: EditNotesModalProps) {
  const [noteText, setNoteText] = useState(existingNote?.note_text || '');
  const [tags, setTags] = useState(existingNote?.tags?.join(', ') || '');
  const [isImportant, setIsImportant] = useState(existingNote?.is_important || false);

  const handleSave = () => {
    if (!noteText.trim()) return;

    onSave({
      note_type: noteType,
      note_text: noteText.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      is_important: isImportant,
    });

    // Reset form
    setNoteText('');
    setTags('');
    setIsImportant(false);
    onClose();
  };

  const handleClose = () => {
    setNoteText(existingNote?.note_text || '');
    setTags(existingNote?.tags?.join(', ') || '');
    setIsImportant(existingNote?.is_important || false);
    onClose();
  };

  const getModalTitle = () => {
    const typeLabel = noteType === 'general' ? 'General' : 
                     noteType === 'service' ? 'Service' : 'Communication';
    return existingNote ? `Edit ${typeLabel} Note` : `Add ${typeLabel} Note`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="note-text">Note Content *</Label>
            <Textarea
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Enter ${noteType} note details...`}
              rows={6}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., urgent, follow-up, important"
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is-important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="is-important">Mark as important</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!noteText.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
          >
            {existingNote ? 'Update Note' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}