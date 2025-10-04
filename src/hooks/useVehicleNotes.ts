import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface VehicleNote {
  id: string;
  vehicle_id: string;
  title?: string;
  note_text: string;
  tags?: string[];
  is_important?: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  user_id?: string;
}

export function useVehicleNotes(vehicleId: string) {
  const queryClient = useQueryClient();

  // Fetch notes
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['vehicle-notes', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_notes')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as VehicleNote[];
    },
    enabled: !!vehicleId,
  });

  // Add note mutation
  const addNoteMutation = useMutation({
    mutationFn: async (noteData: {
      title?: string;
      note_text: string;
      tags?: string[];
      is_important?: boolean;
    }) => {
      const { data, error } = await supabase
        .from('vehicle_notes')
        .insert({
          vehicle_id: vehicleId,
          title: noteData.title,
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
      queryClient.invalidateQueries({ queryKey: ['vehicle-notes', vehicleId] });
      toast({
        title: "Note added successfully",
        description: "The note has been saved to the vehicle profile.",
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
        title?: string;
        note_text: string;
        tags?: string[];
        is_important?: boolean;
      }
    }) => {
      const { data, error } = await supabase
        .from('vehicle_notes')
        .update({
          title: noteData.title,
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
      queryClient.invalidateQueries({ queryKey: ['vehicle-notes', vehicleId] });
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
        .from('vehicle_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-notes', vehicleId] });
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
