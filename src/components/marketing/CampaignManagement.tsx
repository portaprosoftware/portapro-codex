import React, { useState } from 'react';
import { CampaignCreation } from './CampaignCreation';
import { CampaignAnalytics } from './CampaignAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export const CampaignManagement: React.FC = () => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const isMobile = useIsMobile();

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
          <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <SheetTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold">
                <Plus className="h-4 w-4 mr-2" />
                Create Campaign
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="right" 
              className={`${isMobile ? 'w-full' : 'w-3/4'} max-w-none overflow-y-auto`}
            >
              <SheetHeader>
                <SheetTitle>Create New Campaign</SheetTitle>
                <SheetDescription>
                  Create and configure your marketing campaign with targeted messaging.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6">
                <CampaignCreation onClose={() => setIsCreateOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
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
    </div>
  );
};