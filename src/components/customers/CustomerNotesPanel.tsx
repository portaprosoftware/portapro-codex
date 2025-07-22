import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, AlertTriangle, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerNote {
  id: string;
  customer_id: string;
  user_id?: string;
  note_text: string;
  is_important: boolean;
  created_at: string;
  updated_at: string;
}

interface CustomerNotesPanelProps {
  customerId: string;
}

export function CustomerNotesPanel({ customerId }: CustomerNotesPanelProps) {
  const [newNote, setNewNote] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [showAddNote, setShowAddNote] = useState(false);
  const queryClient = useQueryClient();

  const { data: notes, isLoading } = useQuery({
    queryKey: ['customer-notes', customerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_notes')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as CustomerNote[];
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: async ({ note_text, is_important }: { note_text: string; is_important: boolean }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          note_text,
          is_important,
          user_id: 'current-user-id' // Replace with actual user ID from Clerk
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

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    addNoteMutation.mutate({ note_text: newNote.trim(), is_important: isImportant });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <Card className="rounded-2xl h-fit">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Customer Notes</CardTitle>
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
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
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
              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-lg border ${
                    note.is_important
                      ? 'border-orange-200 bg-orange-50'
                      : 'border-border bg-card'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        System User
                      </span>
                      {note.is_important && (
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Important
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="w-3 h-3 mr-1" />
                      {date} at {time}
                    </div>
                  </div>
                  <p className="text-sm text-foreground">{note.note_text}</p>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">No notes yet</p>
              <p className="text-muted-foreground text-xs mt-1">
                Add the first note to start tracking customer interactions
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}