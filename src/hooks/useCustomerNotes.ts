import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CustomerNote {
  id: string;
  customer_id: string;
  note_text: string;
  tags?: string[];
  is_important?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_id?: string;
}

export function useCustomerNotes(customerId: string) {
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
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
    enabled: !!customerId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: {
      note_text: string;
      tags?: string[];
      is_important?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .insert({
          customer_id: customerId,
          note_text: noteData.note_text,
          tags: noteData.tags || [],
          is_important: noteData.is_important || false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      toast({
        title: "Note added successfully",
        description: "The note has been saved to the customer profile.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to add note",
        description: "There was an error saving the note. Please try again.",
        variant: "destructive",
      });
      console.error('Error adding note:', error);
    },
  });

  // Update note mutation
  const updateNoteMutation = useMutation({
    mutationFn: async ({ 
      noteId, 
      noteData 
    }: { 
      noteId: string; 
      noteData: {
        note_text: string;
        tags?: string[];
        is_important?: boolean;
      }
    }) => {
      const { data, error } = await supabase
        .from('customer_notes')
        .update({
          note_text: noteData.note_text,
          tags: noteData.tags || [],
          is_important: noteData.is_important || false,
        })
        .eq('id', noteId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      toast({
        title: "Note updated successfully",
        description: "The note has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update note",
        description: "There was an error updating the note. Please try again.",
        variant: "destructive",
      });
      console.error('Error updating note:', error);
    },
  });

  // Delete note mutation
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      const { error } = await supabase
        .from('customer_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-notes', customerId] });
      toast({
        title: "Note deleted successfully",
        description: "The note has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete note",
        description: "There was an error deleting the note. Please try again.",
        variant: "destructive",
      });
      console.error('Error deleting note:', error);
    },
  });

  return {
    notes,
    isLoading,
    addNote: addNoteMutation.mutate,
    updateNote: updateNoteMutation.mutate,
    deleteNote: deleteNoteMutation.mutate,
    isAdding: addNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}