import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { X } from 'lucide-react';

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
  const [title, setTitle] = useState('');
  const [noteText, setNoteText] = useState('');
  const [tags, setTags] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  // Sync state with existingNote changes
  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title || '');
      setNoteText(existingNote.note_text || '');
      setTags(existingNote.tags?.join(', ') || '');
      setIsImportant(existingNote.is_important || false);
    } else {
      // Reset for new notes
      setTitle('');
      setNoteText('');
      setTags('');
      setIsImportant(false);
    }
  }, [existingNote]);

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
    'Completed',
    'In progress',
    'Needs attention',
    'Customer request',
    'Internal note'
  ];

  const handleQuickTagClick = (tag: string) => {
    const currentTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    if (!currentTags.includes(tag)) {
      // Add tag if not present
      const newTags = [...currentTags, tag];
      setTags(newTags.join(', '));
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const newTags = currentTags.filter(t => t !== tagToRemove);
    setTags(newTags.join(', '));
  };

  const getCurrentTags = () => {
    return tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
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
    // Reset form to original state or clear for new notes
    if (existingNote) {
      setTitle(existingNote.title || '');
      setNoteText(existingNote.note_text || '');
      setTags(existingNote.tags?.join(', ') || '');
      setIsImportant(existingNote.is_important || false);
    } else {
      setTitle('');
      setNoteText('');
      setTags('');
      setIsImportant(false);
    }
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

            {/* Display selected tags as badges */}
            {getCurrentTags().length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 p-3 bg-muted/30 rounded-lg border">
                {getCurrentTags().map((tag) => (
                  <Badge
                    key={tag}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold pl-3 pr-2 py-1 flex items-center gap-1.5"
                  >
                    <span className="capitalize">{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
                      aria-label={`Remove ${tag} tag`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Input
              id="tags"
              value=""
              onChange={(e) => {
                const newTag = e.target.value.trim();
                if (newTag && e.nativeEvent instanceof InputEvent && e.nativeEvent.inputType === 'insertText' && newTag.endsWith(',')) {
                  handleQuickTagClick(newTag.slice(0, -1).trim());
                  e.target.value = '';
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const input = e.currentTarget;
                  const newTag = input.value.trim();
                  if (newTag) {
                    handleQuickTagClick(newTag);
                    input.value = '';
                  }
                }
              }}
              placeholder="Type custom tag and press Enter or comma..."
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="is-important" className="cursor-pointer">
              Mark note as important
            </Label>
            <Switch
              id="is-important"
              checked={isImportant}
              onCheckedChange={setIsImportant}
            />
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