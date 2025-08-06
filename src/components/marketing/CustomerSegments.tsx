
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { SmartSegmentBuilder } from './SmartSegmentBuilder';
import { SegmentDetailsModal } from './SegmentDetailsModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Plus, Users, Edit, Trash2, Eye, Search, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Sort segments alphabetically by name and filter by search query
  const filteredAndSortedSegments = useMemo(() => {
    return [...segments]
      .filter(segment => 
        segment.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (segment.description && segment.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [segments, searchQuery]);

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
      {segments.length === 0 ? (
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Customer Segments ({segments.length})
                </CardTitle>
              </div>
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search segments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-input z-10"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredAndSortedSegments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No segments found</h3>
                <p className="text-muted-foreground text-center mb-6">
                  No segments match "{searchQuery}". Try adjusting your search criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery('')}
                  className="mb-4"
                >
                  Clear Search
                </Button>
                <SmartSegmentBuilder />
              </div>
            ) : (
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
                {filteredAndSortedSegments.map((segment) => (
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background border z-50">
                          <DropdownMenuItem onClick={() => handleViewSegment(segment)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditSegment(segment)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Segment
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete Segment
                              </DropdownMenuItem>
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            )}
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
