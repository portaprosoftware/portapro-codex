import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface EditNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (noteData: {
    note_type: 'general' | 'service' | 'communication';
    title?: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  }) => void;
  noteType: 'general' | 'service' | 'communication';
  existingNote?: {
    id: string;
    title?: string;
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
  const [title, setTitle] = useState(existingNote?.title || '');
  const [noteText, setNoteText] = useState(existingNote?.note_text || '');
  const [tags, setTags] = useState(existingNote?.tags?.join(', ') || '');
  const [isImportant, setIsImportant] = useState(existingNote?.is_important || false);

  // Communication-focused tags
  const communicationTags = [
    'Call today',
    'Text message', 
    'Follow-up required',
    'Email sent',
    'Urgent',
    'Important',
    'Scheduled callback',
    'No answer'
  ];

  // General business tags
  const businessTags = [
    'Follow-up',
    'Urgent', 
    'Important',
    'Completed',
    'In progress',
    'Needs attention',
    'Customer request',
    'Internal note'
  ];

  const handleQuickTagClick = (tag: string) => {
    const currentTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    if (currentTags.includes(tag)) {
      // Remove tag if already present
      const newTags = currentTags.filter(t => t !== tag);
      setTags(newTags.join(', '));
    } else {
      // Add tag if not present
      const newTags = [...currentTags, tag];
      setTags(newTags.join(', '));
    }
  };

  const isTagSelected = (tag: string) => {
    const currentTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    return currentTags.includes(tag);
  };

  const handleSave = () => {
    if (!noteText.trim()) return;

    onSave({
      note_type: noteType,
      title: title.trim() || undefined,
      note_text: noteText.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      is_important: isImportant,
    });

    // Reset form
    setTitle('');
    setNoteText('');
    setTags('');
    setIsImportant(false);
    onClose();
  };

  const handleClose = () => {
    setTitle(existingNote?.title || '');
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
            <Label htmlFor="note-title">Note Title</Label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this note..."
              className="mt-1"
            />
          </div>

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
            <Label htmlFor="tags">Tags</Label>
            
            {/* Communication-focused tags dropdown */}
            <div className="mt-2 mb-3">
              <Label className="text-sm text-muted-foreground mb-2 block">Communication-focused tags</Label>
              <Select onValueChange={(value) => handleQuickTagClick(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a communication tag..." />
                </SelectTrigger>
                <SelectContent>
                  {communicationTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* General business tags dropdown */}
            <div className="mb-3">
              <Label className="text-sm text-muted-foreground mb-2 block">General business tags</Label>
              <Select onValueChange={(value) => handleQuickTagClick(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a business tag..." />
                </SelectTrigger>
                <SelectContent>
                  {businessTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Add custom tags (comma-separated)"
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
            {isImportant && (
              <Badge variant="destructive" className="ml-2">
                Important
              </Badge>
            )}
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