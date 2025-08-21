import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Calendar, Trash2, Edit, AlertTriangle, X } from 'lucide-react';
import { useJobDrafts } from '@/hooks/useJobDrafts';
import { formatDistanceToNow } from 'date-fns';
import { NewJobWizard } from './NewJobWizard';

export const JobDraftManagement: React.FC = () => {
  const { drafts, deleteDraft, isLoading } = useJobDrafts();
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const handleResumeDraft = (draft: any) => {
    console.log('Resuming draft:', draft);
    setSelectedDraft(draft);
    setIsResumeOpen(true);
  };

  const handleDeleteAllDrafts = async () => {
    // Delete all drafts one by one
    for (const draft of drafts) {
      await deleteDraft(draft.id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading drafts...</div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <Card className="w-full max-w-md border-dashed">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <FileText className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg font-inter">No drafts yet</CardTitle>
            <CardDescription className="font-inter">
              Job drafts will appear here when you save your progress in the job wizard
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-inter">Job Drafts</h2>
          <p className="text-gray-600 font-inter">Resume or manage your saved job drafts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-inter">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </Badge>
          {drafts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 font-inter"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <AlertDialogTitle className="font-inter">Delete All Drafts</AlertDialogTitle>
                    </div>
                  </div>
                  <AlertDialogDescription className="font-inter mt-2">
                    Are you sure you want to delete all {drafts.length} job drafts? This action cannot be undone and will permanently remove all saved draft jobs.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-inter">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAllDrafts}
                    className="bg-red-600 hover:bg-red-700 font-inter"
                  >
                    Delete All Drafts
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Edit className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-inter">{draft.name}</CardTitle>
                    <CardDescription className="font-inter flex items-center gap-2 mt-1">
                      <Calendar className="h-3 w-3" />
                      Last updated {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleResumeDraft(draft)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-inter"
                  >
                    Resume
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-inter">Delete Draft</AlertDialogTitle>
                        <AlertDialogDescription className="font-inter">
                          Are you sure you want to delete the draft "{draft.name}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-inter">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteDraft(draft.id)}
                          className="bg-red-600 hover:bg-red-700 font-inter"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Resume Draft Modal */}
      <NewJobWizard
        open={isResumeOpen}
        onOpenChange={setIsResumeOpen}
        draftData={selectedDraft}
      />
    </div>
  );
};