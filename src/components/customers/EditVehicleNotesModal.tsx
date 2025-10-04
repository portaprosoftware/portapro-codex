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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  const [tags, setTags] = useState('');
  const [customTagInput, setCustomTagInput] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  // Reset form when modal opens/closes or existing note changes
  useEffect(() => {
    if (isOpen) {
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
      setCustomTagInput('');
    }
  }, [isOpen, existingNote]);

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
      title: title.trim() || undefined,
      note_text: noteText.trim(),
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      is_important: isImportant,
    });

    // Reset form
    setTitle('');
    setNoteText('');
    setTags('');
    setCustomTagInput('');
    setIsImportant(false);
  };

  const handleClose = () => {
    setTitle('');
    setNoteText('');
    setTags('');
    setCustomTagInput('');
    setIsImportant(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {existingNote ? 'Edit Vehicle Note' : 'Add Vehicle Note'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Note Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for this note..."
              className="mt-1"
            />
          </div>

          {/* Note Text */}
          <div>
            <Label htmlFor="note-text">Note Content *</Label>
            <Textarea
              id="note-text"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter vehicle note details..."
              rows={6}
              className="mt-1"
            />
          </div>

          {/* Tags */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            
            {/* Vehicle-focused tags dropdown */}
            <div className="mt-2 mb-3">
              <Label className="text-sm text-muted-foreground mb-2 block">Vehicle-focused tags</Label>
              <Select onValueChange={(value) => handleQuickTagClick(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a vehicle tag..." />
                </SelectTrigger>
                <SelectContent className="bg-background max-h-[300px]">
                  {vehicleTags.map((tag) => (
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
                <SelectContent className="bg-background max-h-[300px]">
                  {generalTags.map((tag) => (
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

            <div>
              <Input
                id="tags"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const newTag = customTagInput.trim();
                    if (newTag) {
                      handleQuickTagClick(newTag);
                      setCustomTagInput('');
                    }
                  }
                }}
                placeholder="Type custom tag and press Enter or comma..."
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> or add a <kbd className="px-1 py-0.5 bg-muted rounded text-xs">,</kbd> to add tag
              </p>
            </div>
          </div>

          {/* Important Toggle */}
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="important" className="cursor-pointer">
              Mark Important / Urgent
            </Label>
            <Switch
              id="important"
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
