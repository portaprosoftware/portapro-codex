import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, Plus, Filter, FileText } from 'lucide-react';
import { useCustomerNotes } from '@/hooks/useCustomerNotes';
import { EditNotesModal } from './EditNotesModal';
import { ViewNoteModal } from './ViewNoteModal';
import { DeleteConfirmationModal } from '@/components/ui/delete-confirmation-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';

interface CustomerNotesTabProps {
  customerId: string;
}

export function CustomerNotesTab({ customerId }: CustomerNotesTabProps) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useCustomerNotes(customerId);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [viewingNote, setViewingNote] = useState<any>(null);
  const [deletingNote, setDeletingNote] = useState<any>(null);
  const [selectedNoteType, setSelectedNoteType] = useState<'general' | 'service' | 'communication'>('general');
  
  // Filter states
  const [selectedCommunicationTag, setSelectedCommunicationTag] = useState<string>('all');
  const [selectedGeneralTag, setSelectedGeneralTag] = useState<string>('all');
  const [showImportantOnly, setShowImportantOnly] = useState(false);

  // Tag options
  const communicationTags = [
    'Call today', 'Text message', 'Follow-up required', 'Email sent', 
    'Urgent', 'Important', 'Scheduled callback', 'No answer'
  ];
  
  const generalTags = [
    'Follow-up', 'Completed', 'In progress', 
    'Needs attention', 'Customer request', 'Internal note'
  ];

  const handleAddNote = (noteType: 'general' | 'service' | 'communication') => {
    setSelectedNoteType(noteType);
    setEditingNote(null);
    setShowModal(true);
  };

  const handleEditNote = (note: any) => {
    setEditingNote(note);
    setSelectedNoteType('general'); // Default type since we store all notes in same table
    setShowModal(true);
  };

  const handleViewNote = (note: any) => {
    setViewingNote(note);
    setShowViewModal(true);
  };

  const handleSaveNote = (noteData: {
    note_type: 'general' | 'service' | 'communication';
    title?: string;
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  }) => {
    if (editingNote) {
      updateNote({
        noteId: editingNote.id,
        noteData: {
          title: noteData.title,
          note_text: noteData.note_text,
          tags: noteData.tags,
          is_important: noteData.is_important,
        }
      });
    } else {
      addNote({
        title: noteData.title,
        note_text: noteData.note_text,
        tags: noteData.tags,
        is_important: noteData.is_important,
      });
    }
  };

  const handleDeleteNote = (note: any) => {
    setDeletingNote(note);
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = () => {
    if (deletingNote) {
      deleteNote(deletingNote.id);
      setDeletingNote(null);
    }
  };

  // Filter notes based on selected criteria
  const filteredNotes = notes?.filter(note => {
    // Filter by important status
    if (showImportantOnly && !note.is_important) {
      return false;
    }

    // Filter by communication tags
    if (selectedCommunicationTag !== 'all') {
      const hasTag = note.tags?.includes(selectedCommunicationTag);
      if (!hasTag) return false;
    }

    // Filter by general tags
    if (selectedGeneralTag !== 'all') {
      const hasTag = note.tags?.includes(selectedGeneralTag);
      if (!hasTag) return false;
    }

    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-muted-foreground">Loading notes...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notes Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Customer Notes</h3>
        <Button
          onClick={() => handleAddNote('general')}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium px-4 py-2 rounded-md border-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {/* Filters Section */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Communication Tags Filter */}
            <div className="space-y-2">
              <Label htmlFor="communication-filter">Communication</Label>
              <Select value={selectedCommunicationTag} onValueChange={setSelectedCommunicationTag}>
                <SelectTrigger className="bg-background border border-border">
                  <SelectValue placeholder="All communication tags" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">All communication tags</SelectItem>
                  {communicationTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* General Tags Filter */}
            <div className="space-y-2">
              <Label htmlFor="general-filter">General</Label>
              <Select value={selectedGeneralTag} onValueChange={setSelectedGeneralTag}>
                <SelectTrigger className="bg-background border border-border">
                  <SelectValue placeholder="All general tags" />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="all">All general tags</SelectItem>
                  {generalTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Important Toggle */}
            <div className="space-y-2">
              <Label htmlFor="important-toggle">Important / Urgent Only</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="important-toggle"
                  checked={showImportantOnly}
                  onCheckedChange={setShowImportantOnly}
                />
                <span className="text-sm text-muted-foreground">
                  {showImportantOnly ? 'Showing important notes only' : 'Showing all notes'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes Display */}
      {filteredNotes.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {notes?.length === 0 ? 'No Notes Yet' : 'No Matching Notes'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {notes?.length === 0 
                  ? 'Start by adding your first note for this customer.'
                  : 'Try adjusting your filters to see more notes.'
                }
              </p>
              {notes?.length === 0 && (
                <Button
                  onClick={() => handleAddNote('general')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Note
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Notes ({filteredNotes.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {/* Header Row */}
            <div className="grid grid-cols-12 gap-4 pb-3 border-b text-sm font-medium text-muted-foreground">
              <div className="col-span-4">Title</div>
              <div className="col-span-4">Content Preview</div>
              <div className="col-span-2">Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            
            {/* Notes List */}
            <div className="space-y-0">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="grid grid-cols-12 gap-4 py-3 border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                >
                  {/* Title Column */}
                  <div className="col-span-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewNote(note)}
                        className="text-sm font-medium text-foreground hover:text-primary cursor-pointer text-left"
                      >
                        {note.title || 'Customer Note'}
                      </button>
                      {note.is_important && (
                        <Badge variant="destructive" className="text-xs">
                          Important
                        </Badge>
                      )}
                    </div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs h-5">
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs h-5">
                            +{note.tags.length - 2} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Content Preview Column */}
                  <div className="col-span-4">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {note.note_text.length > 100 
                        ? `${note.note_text.substring(0, 100)}...` 
                        : note.note_text
                      }
                    </p>
                  </div>
                  
                  {/* Date Column */}
                  <div className="col-span-2">
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'MMM d, yyyy')}
                    </div>
                    {note.updated_at !== note.created_at && (
                      <div className="text-xs text-muted-foreground">
                        Updated {format(new Date(note.updated_at), 'MMM d')}
                      </div>
                    )}
                  </div>
                  
                  {/* Actions Column */}
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNote(note)}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Modal */}
      <EditNotesModal
        key={editingNote?.id || 'new-note'}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveNote}
        noteType={selectedNoteType}
        existingNote={editingNote ? {
          id: editingNote.id,
          title: editingNote.title,
          note_text: editingNote.note_text,
          tags: editingNote.tags,
          is_important: editingNote.is_important,
        } : undefined}
      />
      
      {/* View Note Modal */}
      <ViewNoteModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        note={viewingNote}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteNote}
        title="Delete Note"
        description={`Are you sure you want to delete "${deletingNote?.title || 'this note'}"? This action cannot be undone.`}
        confirmText="Delete Note"
        cancelText="Cancel"
      />
    </div>
  );
}