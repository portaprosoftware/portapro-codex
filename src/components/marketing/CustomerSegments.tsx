
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SmartSegmentBuilder } from './SmartSegmentBuilder';
import { SegmentDetailsModal } from './SegmentDetailsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Users, Edit, Trash2, Eye } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CustomerSegment {
  id: string;
  name: string;
  description?: string;
  rule_set: Record<string, any>;
  customer_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const CustomerSegments: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingSegment, setEditingSegment] = useState<CustomerSegment | null>(null);
  const [viewingSegment, setViewingSegment] = useState<CustomerSegment | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCounter, setEditCounter] = useState(0);

  // Fetch existing customer segments
  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['customer-segments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_segments')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CustomerSegment[];
    }
  });

  // Sort segments alphabetically by name
  const sortedSegments = [...segments].sort((a, b) => a.name.localeCompare(b.name));

  // Delete segment mutation
  const deleteSegmentMutation = useMutation({
    mutationFn: async (segmentId: string) => {
      const { error } = await supabase
        .from('customer_segments')
        .delete()
        .eq('id', segmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customer-segments'] });
      toast({
        title: 'Segment Deleted',
        description: 'Customer segment has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete segment.',
        variant: 'destructive',
      });
    },
  });

  const handleDeleteSegment = (segmentId: string) => {
    deleteSegmentMutation.mutate(segmentId);
  };

  const handleEditSegment = (segment: CustomerSegment) => {
    setEditingSegment(segment);
    setIsEditDialogOpen(true);
    setEditCounter(prev => prev + 1); // Force component remount
  };

  const handleViewSegment = (segment: CustomerSegment) => {
    setViewingSegment(segment);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingSegment(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded w-full"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Customer Segments</h2>
          <p className="text-muted-foreground">
            Create and manage customer segments for targeted marketing.
          </p>
        </div>
        <SmartSegmentBuilder />
      </div>

      {/* Segments List */}
      {sortedSegments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No segments yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Get started by creating your first customer segment.
            </p>
            <SmartSegmentBuilder />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Customer Segments ({sortedSegments.length})
            </CardTitle>
            <CardDescription>
              Manage your customer segments in alphabetical order
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedSegments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {segment.name}
                        <Badge variant="outline" className="text-xs">
                          Active
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground max-w-md truncate">
                        {segment.description || 'No description provided'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {segment.customer_count.toLocaleString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(segment.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewSegment(segment)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditSegment(segment)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Segment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{segment.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSegment(segment.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      {editingSegment && (
        <SmartSegmentBuilder
          existingSegment={editingSegment}
          mode="edit"
          isOpen={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          key={`edit-${editingSegment.id}-${editCounter}`}
        />
      )}

      {/* View Details Modal */}
      <SegmentDetailsModal
        segment={viewingSegment}
        isOpen={!!viewingSegment}
        onClose={() => setViewingSegment(null)}
      />
    </div>
  );
};
