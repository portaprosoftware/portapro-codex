import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { CustomModal } from '@/components/ui/custom-modal';
import { FileText, Calendar, Trash2, Edit, AlertTriangle, X } from 'lucide-react';
import { useCampaignDrafts } from '@/hooks/useCampaignDrafts';
import { formatDistanceToNow } from 'date-fns';
import { CampaignCreation } from './CampaignCreation';

export const DraftManagement: React.FC = () => {
  const { drafts, deleteDraft, isLoading } = useCampaignDrafts();
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isResumeOpen, setIsResumeOpen] = useState(false);

  const handleResumeDraft = (draft: any) => {
    setSelectedDraft(draft);
    setIsResumeOpen(true);
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
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
      <Card>
        <CardHeader className="text-center py-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-gray-400" />
          </div>
          <CardTitle className="text-lg font-inter">No drafts yet</CardTitle>
          <CardDescription className="font-inter">
            Draft campaigns will appear here when you save them during creation.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold font-inter">Campaign Drafts</h2>
          <p className="text-gray-600 font-inter">Resume or manage your saved campaign drafts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="font-inter">
            {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
          </Badge>
          {drafts.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="font-inter">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <AlertDialogTitle className="font-inter">Delete All Drafts</AlertDialogTitle>
                    </div>
                  </div>
                  <AlertDialogDescription className="font-inter mt-2">
                    Are you sure you want to delete all {drafts.length} campaign drafts? This action cannot be undone and will permanently remove all saved draft campaigns.
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
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold font-inter truncate">
                      {draft.name || 'Untitled Campaign'}
                    </h3>
                    <Badge variant="outline" className="font-inter">
                      Draft
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-inter">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Saved {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResumeDraft(draft)}
                    className="font-inter"
                  >
                    Resume
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-inter">Delete Draft</AlertDialogTitle>
                        <AlertDialogDescription className="font-inter">
                          Are you sure you want to delete this campaign draft? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="font-inter">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteDraft(draft.id)}
                          className="bg-red-600 hover:bg-red-700 font-inter"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Resume Draft Dialog */}
      <CustomModal
        isOpen={isResumeOpen}
        onClose={() => {
          setIsResumeOpen(false);
          setSelectedDraft(null);
        }}
        title="Resume Campaign Draft"
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        preventClose={false}
      >
        {selectedDraft && (
          <CampaignCreation 
            onClose={() => {
              setIsResumeOpen(false);
              setSelectedDraft(null);
            }}
            draftId={selectedDraft.id}
            initialData={selectedDraft.campaign_data}
          />
        )}
      </CustomModal>
    </div>
  );
};