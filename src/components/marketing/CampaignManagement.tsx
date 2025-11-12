import React, { useState } from 'react';
import { CampaignCreation } from './CampaignCreation';
import { CampaignAnalytics } from './CampaignAnalytics';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
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
      {/* Single White Card - All Campaign Content */}
      <div className="bg-white rounded-xl border shadow-sm p-4 md:p-6 space-y-6">
        {/* Campaign Creation Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 font-inter">Create Campaign</h2>
            <p className="text-sm text-gray-600 mt-1">
              Emails and texts will go to the company phone number and email address listed in each customer's profile under 'Overview'.
            </p>
          </div>
          
          {/* Desktop Button */}
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="hidden md:flex bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold w-full md:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>

          {/* Mobile FAB - Fixed position */}
          <div className="md:hidden fixed bottom-20 right-4 z-40">
            <Button 
              onClick={() => setIsCreateOpen(true)}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
            >
              <Plus className="h-6 w-6" />
            </Button>
          </div>

          <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DrawerContent className="h-[95vh] w-full">
              <div className="mx-auto w-full h-full flex flex-col">
                <DrawerHeader className="border-b relative pb-4">
                  <DrawerTitle>Create New Campaign</DrawerTitle>
                  <DrawerDescription>
                    Create and configure your marketing campaign with targeted messaging.
                  </DrawerDescription>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-3"
                    onClick={handleClose}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DrawerHeader>
                <div className="flex-1 overflow-y-auto px-4 md:px-6" data-campaign-creation>
                  <CampaignCreation onClose={() => setIsCreateOpen(false)} />
                </div>
              </div>
            </DrawerContent>
          </Drawer>
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Performance Summary Section */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Performance Summary</h2>
          <CampaignAnalytics />
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
