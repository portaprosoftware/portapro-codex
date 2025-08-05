import React, { useState } from 'react';
import { CampaignCreation } from './CampaignCreation';
import { CampaignAnalytics } from './CampaignAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export const CampaignManagement: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  const handleClose = () => {
    setShowExitConfirmation(true);
  };

  const confirmClose = () => {
    setShowExitConfirmation(false);
    setIsCreateOpen(false);
  };

  const cancelClose = () => {
    setShowExitConfirmation(false);
  };

  return (
    <div className="space-y-6">
      {/* Campaign Creation */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-inter">Create Campaign</h2>
            <p className="text-sm text-gray-600 mt-1">
              Emails and texts will go to the company phone number and email address listed in each customer's profile under 'Overview'.
            </p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={(open) => {
            if (!open) {
              setShowExitConfirmation(true);
            } else {
              setIsCreateOpen(open);
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent 
              className="max-w-4xl max-h-[90vh] overflow-y-auto"
              onInteractOutside={(e) => e.preventDefault()}
              onOpenAutoFocus={(e) => e.preventDefault()}
              hideCloseButton={true}
            >
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>Create New Campaign</DialogTitle>
                    <DialogDescription>
                      Create and configure your marketing campaign with targeted messaging.
                    </DialogDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClose}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="mt-6" data-campaign-creation>
                <CampaignCreation onClose={() => setIsCreateOpen(false)} />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Campaign Analytics */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Campaign Performance</h2>
        <CampaignAnalytics />
      </div>

      {/* Customer Types Overview */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Customer Types</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="purple" className="font-semibold">Events & Festivals</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="info" className="font-semibold">Construction</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="success" className="font-semibold">Municipal & Government</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="gradient" className="font-semibold">Private Events & Weddings</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="warning" className="font-semibold">Sports & Recreation</Badge>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Badge variant="destructive" className="font-semibold">Emergency & Disaster Relief</Badge>
          </div>
        </div>
      </div>

      {/* Simple Exit Confirmation */}
      <AlertDialog open={showExitConfirmation} onOpenChange={setShowExitConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will close the campaign editor. Any unsaved changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelClose}>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};