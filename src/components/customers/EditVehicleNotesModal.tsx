import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { X } from 'lucide-react';

interface EditVehicleNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    title?: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  }) => void;
  existingNote?: {
    id: string;
    title?: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  } | null;
  vehicleTags?: string[];
  generalTags?: string[];
}

export function EditVehicleNotesModal({
  isOpen,
  onClose,
  onSave,
  existingNote = null,
  vehicleTags = [],
  generalTags = [],
}: EditVehicleNotesModalProps) {
  const [title, setTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isImportant, setIsImportant] = useState(false);

  // Reset form when modal opens/closes or existing note changes
  useEffect(() => {
    if (isOpen) {
      if (existingNote) {
        setTitle(existingNote.title || '');
        setNoteText(existingNote.note_text || '');
        setTags(existingNote.tags || []);
        setIsImportant(existingNote.is_important || false);
      } else {
        setTitle('');
        setNoteText('');
        setTags([]);
        setIsImportant(false);
      }
    }
  }, [isOpen, existingNote]);

  const handleQuickTagClick = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const isTagSelected = (tag: string) => tags.includes(tag);

  const handleSave = () => {
    if (!noteText.trim()) return;

    onSave({
      title: title.trim() || undefined,
      note_text: noteText.trim(),
      tags,
      is_important: isImportant,
    });

    // Reset form
    setTitle('');
    setNoteText('');
    setTags([]);
    setIsImportant(false);
  };

  const handleClose = () => {
    setTitle('');
    setNoteText('');
    setTags([]);
    setIsImportant(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {existingNote ? 'Edit Note' : 'Add New Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter note title"
            />
          </div>

          {/* Note Text */}
          <div className="space-y-2">
            <Label htmlFor="note-text">Note *</Label>
            <Textarea
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter your note here..."
              rows={4}
              required
            />
          </div>

          {/* Vehicle Tags */}
          {vehicleTags.length > 0 && (
            <div className="space-y-2">
              <Label>Vehicle Tags</Label>
              <div className="flex flex-wrap gap-2">
                {vehicleTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={isTagSelected(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleQuickTagClick(tag)}
                  >
                    {tag}
                    {isTagSelected(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* General Tags */}
          {generalTags.length > 0 && (
            <div className="space-y-2">
              <Label>General Tags</Label>
              <div className="flex flex-wrap gap-2">
                {generalTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={isTagSelected(tag) ? 'default' : 'outline'}
                    className="cursor-pointer hover:opacity-80"
                    onClick={() => handleQuickTagClick(tag)}
                  >
                    {tag}
                    {isTagSelected(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Important Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="important"
              checked={isImportant}
              onCheckedChange={(checked) => setIsImportant(checked === true)}
            />
            <Label htmlFor="important" className="cursor-pointer">
              Mark as Important
              {isImportant && (
                <Badge variant="destructive" className="ml-2 text-xs">
                  Important
                </Badge>
              )}
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!noteText.trim()}>
            {existingNote ? 'Update Note' : 'Add Note'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
