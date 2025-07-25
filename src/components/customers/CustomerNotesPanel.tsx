import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, AlertTriangle, User, Calendar, Edit2, Trash2, Activity } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { toast } from 'sonner';

interface CustomerNote {
  id: string;
  customer_id: string;
  note_text: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  user_first_name?: string;
  user_last_name?: string;
  user_email?: string;
}

interface CustomerNotesPanelProps {
  customerId: string;
}

export function CustomerNotesPanel({ customerId }: CustomerNotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNote, setEditingNote] = useState<CustomerNote | null>(null);
  const [editNoteText, setEditNoteText] = useState('');
  const [editIsImportant, setEditIsImportant] = useState(false);
  const queryClient = useQueryClient();
  const { user, hasAdminAccess } = useUserRole();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_customer_notes_with_users', {
        customer_uuid: customerId
      });
      
      if (error) throw error;
      return data as CustomerNote[];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ note_text, is_important }: { note_text: string; is_important: boolean }) => {
      // First ensure the user is registered in the system
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Ensure user is registered with their Clerk ID
      const { data: registrationData, error: registrationError } = await supabase
        .rpc('ensure_user_registered', {
          clerk_user_id_param: user.id,
          first_name_param: user.firstName || null,
          last_name_param: user.lastName || null,
          email_param: user.primaryEmailAddress?.emailAddress || null,
          role_param: 'owner'
        });

      if (registrationError) {
        console.error('Error registering user:', registrationError);
      }

      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          note_text,
          is_important,
          created_by: user.id // Now using Clerk user ID directly
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      setNewNote('');
      setIsImportant(false);
      setShowAddNote(false);
      toast.success('Note added successfully');
    },
    onError: (error) => {
      toast.error('Failed to add note');
      console.error('Error adding note:', error);
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note_text, is_important }: { id: string; note_text: string; is_important: boolean }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .update({
          note_text,
          is_important,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      setEditingNote(null);
      toast.success('Note updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update note');
      console.error('Error updating note:', error);
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      toast.success('Note deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete note');
      console.error('Error deleting note:', error);
    },
  });

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ note_text: newNote.trim(), is_important: isImportant });
  };

  const handleEditNote = (note: CustomerNote) => {
    setEditingNote(note);
    setEditNoteText(note.note_text);
    setEditIsImportant(note.is_important);
  };

  const handleUpdateNote = () => {
    if (!editingNote || !editNoteText.trim()) return;
    updateNoteMutation.mutate({
      id: editingNote.id,
      note_text: editNoteText.trim(),
      is_important: editIsImportant
    });
  };

  const handleDeleteNote = (id: string) => {
    deleteNoteMutation.mutate(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getUserName = (note: CustomerNote) => {
    if (note.user_first_name || note.user_last_name) {
      return `${note.user_first_name || ''} ${note.user_last_name || ''}`.trim();
    }
    return note.user_email || 'System User';
  };

  const canEditNote = (note: CustomerNote) => {
    return hasAdminAccess || note.created_by === user?.id;
  };

  return (
    <>
      <Card className="rounded-2xl h-fit">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Active: Customer Notes & Updates</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddNote(!showAddNote)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {showAddNote && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <Textarea
                placeholder="Add a note about this customer..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="important"
                    checked={isImportant}
                    onCheckedChange={setIsImportant}
                  />
                  <Label htmlFor="important" className="text-sm">
                    Mark as important
                  </Label>
                </div>
                <div className="space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddNote(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNote}
                    disabled={addNoteMutation.isPending || !newNote.trim()}
                  >
                    {addNoteMutation.isPending ? 'Adding...' : 'Add Note'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : notes && notes.length > 0 ? (
              notes.map((note) => {
                const { date, time } = formatDate(note.created_at);
                const wasEdited = note.updated_at !== note.created_at;
                return (
                  <div
                    key={note.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      note.is_important
                        ? 'border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/50'
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">
                            {getUserName(note)}
                          </span>
                          {note.is_important && (
                            <Badge className="ml-2 bg-orange-100 text-orange-800 text-xs">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Important
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3 mr-1" />
                          {date} at {time}
                          {wasEdited && <span className="ml-1">(edited)</span>}
                        </div>
                        {canEditNote(note) && (
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditNote(note)}
                              className="h-6 w-6 p-0"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this note? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{note.note_text}</p>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No activity yet</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Add the first note to start tracking customer interactions
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!editingNote} onOpenChange={() => setEditingNote(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to your note below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Edit your note..."
              value={editNoteText}
              onChange={(e) => setEditNoteText(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-important"
                checked={editIsImportant}
                onCheckedChange={setEditIsImportant}
              />
              <Label htmlFor="edit-important" className="text-sm">
                Mark as important
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingNote(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateNote}
              disabled={updateNoteMutation.isPending || !editNoteText.trim()}
            >
              {updateNoteMutation.isPending ? 'Updating...' : 'Update Note'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}