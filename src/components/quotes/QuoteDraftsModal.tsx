import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useQuoteDrafts } from '@/hooks/useQuoteDrafts';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { NewQuoteWizard } from './NewQuoteWizard';

interface QuoteDraftsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuoteDraftsModal: React.FC<QuoteDraftsModalProps> = ({ open, onOpenChange }) => {
  const { drafts, isLoading, deleteDraft, isDeleting } = useQuoteDrafts();
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);

  const handleResumeDraft = (draft: any) => {
    console.log('Resuming draft:', draft);
    setSelectedDraft(draft);
    setIsResumeOpen(true);
    onOpenChange(false); // Close drafts modal when resuming
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await deleteDraft(draftId);
      toast.success('Quote draft deleted successfully');
    } catch (error) {
      console.error('Failed to delete quote draft:', error);
      toast.error('Failed to delete quote draft');
    }
    setShowDeleteConfirm(null);
  };

  const handleDeleteAll = async () => {
    try {
      await Promise.all(drafts.map(draft => deleteDraft(draft.id)));
      toast.success('All quote drafts deleted successfully');
    } catch (error) {
      console.error('Failed to delete all quote drafts:', error);
      toast.error('Failed to delete all quote drafts');
    }
    setShowDeleteAllConfirm(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DialogTitle>Quote Drafts</DialogTitle>
                <Badge variant="secondary">{drafts.length}</Badge>
              </div>
              {drafts.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              )}
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading quote drafts...</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No quote drafts found. Start creating a quote to save drafts automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {drafts.map((draft) => (
                <Card key={draft.id} className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-foreground">{draft.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {(draft.quote_data as any)?.customer?.name || 'No customer assigned'} • ${((draft.quote_data as any)?.totalCost || 0).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          onClick={() => handleResumeDraft(draft)}
                          className="flex-1 bg-primary hover:bg-primary/90"
                        >
                          Resume
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowDeleteConfirm(draft.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteAllConfirm} onOpenChange={setShowDeleteAllConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Quote Drafts</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all {drafts.length} quote drafts? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive hover:bg-destructive/90">
              Delete All Drafts
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Single Draft Confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Quote Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this quote draft? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => showDeleteConfirm && handleDeleteDraft(showDeleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resume Quote Wizard */}
      {isResumeOpen && selectedDraft && (
        <NewQuoteWizard
          open={isResumeOpen}
          onOpenChange={setIsResumeOpen}
          draftData={selectedDraft}
        />
      )}
    </>
  );
};
