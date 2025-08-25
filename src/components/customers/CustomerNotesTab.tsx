import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCustomerNotes } from '@/hooks/useCustomerNotes';
import { EditNotesModal } from './EditNotesModal';
import { format } from 'date-fns';

interface CustomerNotesTabProps {
  customerId: string;
}

export function CustomerNotesTab({ customerId }: CustomerNotesTabProps) {
  const { notes, isLoading, addNote, updateNote, deleteNote } = useCustomerNotes(customerId);
  const [showModal, setShowModal] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const [selectedNoteType, setSelectedNoteType] = useState<'general' | 'service' | 'communication'>('general');

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

  const handleSaveNote = (noteData: {
    note_type: 'general' | 'service' | 'communication';
    note_text: string;
    tags?: string[];
    is_important?: boolean;
  }) => {
    if (editingNote) {
      updateNote({
        noteId: editingNote.id,
        noteData: {
          note_text: noteData.note_text,
          tags: noteData.tags,
          is_important: noteData.is_important,
        }
      });
    } else {
      addNote({
        note_text: noteData.note_text,
        tags: noteData.tags,
        is_important: noteData.is_important,
      });
    }
  };

  const handleDeleteNote = (noteId: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNote(noteId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading notes...</p>
        </div>
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

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card className="rounded-2xl">
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Notes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start by adding your first note for this customer.
              </p>
              <Button
                onClick={() => handleAddNote('general')}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add First Note
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <CardTitle className="text-base">
                    Customer Note
                  </CardTitle>
                  {note.is_important && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      Important
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditNote(note)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-foreground whitespace-pre-wrap mb-3">
                  {note.note_text}
                </p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  Added {format(new Date(note.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  {note.updated_at !== note.created_at && (
                    <span> • Updated {format(new Date(note.updated_at), 'MMM d, yyyy \'at\' h:mm a')}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <EditNotesModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleSaveNote}
        noteType={selectedNoteType}
        existingNote={editingNote ? {
          id: editingNote.id,
          note_text: editingNote.note_text,
          tags: editingNote.tags,
          is_important: editingNote.is_important,
        } : undefined}
      />
    </div>
  );
}