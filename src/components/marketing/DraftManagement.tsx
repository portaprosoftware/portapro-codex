import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { FileText, Calendar, Trash2, Play, Edit } from 'lucide-react';
import { useCampaignDrafts } from '@/hooks/useCampaignDrafts';
import { formatDistanceToNow } from 'date-fns';

export const DraftManagement: React.FC = () => {
  const { drafts, deleteDraft, isLoading } = useCampaignDrafts();

  const handleResumeDraft = (draftId: string) => {
    // Navigate to campaign creation with draft data
    const draft = drafts.find(d => d.id === draftId);
    if (draft) {
      // This would typically navigate to the campaign creation with the draft data
      console.log('Resuming draft:', draft);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    await deleteDraft(draftId);
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
        <CardContent className="text-center pb-8">
          <Button>
            <Edit className="w-4 h-4 mr-2" />
            Create Campaign
          </Button>
        </CardContent>
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
        <Badge variant="secondary" className="font-inter">
          {drafts.length} draft{drafts.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {drafts.map((draft) => (
          <Card key={draft.id} className="transition-all hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold font-inter truncate">
                      {draft.campaign_name || 'Untitled Campaign'}
                    </h3>
                    <Badge variant="outline" className="font-inter">
                      Step {draft.current_step || 1}/4
                    </Badge>
                  </div>
                  
                  {draft.campaign_description && (
                    <p className="text-sm text-gray-600 font-inter mb-3 line-clamp-2">
                      {draft.campaign_description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 text-xs text-gray-500 font-inter">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Saved {formatDistanceToNow(new Date(draft.updated_at), { addSuffix: true })}
                    </div>
                    {draft.audience_type && (
                      <div className="flex items-center gap-1">
                        <span>•</span>
                        <span className="capitalize">{draft.audience_type}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResumeDraft(draft.id)}
                    className="font-inter"
                  >
                    <Play className="w-4 h-4 mr-1" />
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
    </div>
  );
};