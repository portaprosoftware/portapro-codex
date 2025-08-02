import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Edit2, Trash2, MapPin } from 'lucide-react';

interface AssignedInventory {
  id: string;
  product_id: string;
  assigned_quantity: number;
  notes?: string;
  created_at: string;
  products: {
    name: string;
    description?: string;
  };
}

interface AssignedInventoryListProps {
  coordinateId: string;
  onEdit?: (assignmentId: string) => void;
  onDelete?: (assignmentId: string) => void;
}

export function AssignedInventoryList({ coordinateId, onEdit, onDelete }: AssignedInventoryListProps) {
  const { data: assignments, isLoading, refetch } = useQuery({
    queryKey: ['pin-inventory-assignments', coordinateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pin_inventory_assignments')
        .select(`
          *,
          products (
            name,
            description
          )
        `)
        .eq('coordinate_id', coordinateId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as AssignedInventory[];
    }
  });

  const handleDelete = async (assignmentId: string) => {
    if (!onDelete) return;
    
    try {
      const { error } = await supabase
        .from('pin_inventory_assignments')
        .delete()
        .eq('id', assignmentId);
      
      if (error) throw error;
      
      refetch();
      onDelete(assignmentId);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Package className="w-4 h-4 animate-pulse" />
          <span>Loading assigned inventory...</span>
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
        <p className="text-muted-foreground mb-2">No template items defined</p>
        <p className="text-sm text-muted-foreground">
          Use the "Add Template Items" tab to define typical inventory for this pin
        </p>
      </div>
    );
  }

  const totalItems = assignments.reduce((sum, assignment) => sum + assignment.assigned_quantity, 0);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-primary/5 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {assignments.length} template item type(s) • {totalItems} total units
          </span>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="transition-all hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-foreground truncate">
                      {assignment.products.name}
                    </h4>
                    <Badge variant="default" className="shrink-0">
                      {assignment.assigned_quantity} units
                    </Badge>
                  </div>
                  
                  {assignment.products.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {assignment.products.description}
                    </p>
                  )}
                  
                  {assignment.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      Note: {assignment.notes}
                    </p>
                  )}
                  
                  <p className="text-xs text-muted-foreground mt-1">
                    Assigned {new Date(assignment.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-1 ml-4">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(assignment.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(assignment.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}