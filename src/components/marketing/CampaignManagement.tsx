import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CampaignCreation } from './CampaignCreation';
import { CampaignAnalytics } from './CampaignAnalytics';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { CustomModal } from '@/components/ui/custom-modal';
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
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>

          <CustomModal
            isOpen={isCreateOpen}
            onClose={handleClose}
            title="Create New Campaign"
            description="Create and configure your marketing campaign with targeted messaging."
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
          >
            <div data-campaign-creation>
              <CampaignCreation onClose={() => setIsCreateOpen(false)} />
            </div>
          </CustomModal>
        </div>
      </div>

      {/* Campaign Analytics */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Campaign Performance</h2>
        <CampaignAnalytics />
      </div>

      {/* Customer Types Overview */}
      <CustomerTypesOverview />

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

const CustomerTypesOverview: React.FC = () => {
  // Fetch customer type counts
  const { data: customerTypes = [] } = useQuery({
    queryKey: ['customer-type-counts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_customer_type_counts');
      if (error) {
        console.error('Error fetching customer type counts:', error);
        return [];
      }
      return data || [];
    }
  });

  const getTypeGradient = (type: string) => {
    const typeGradients = {
      'events_festivals': 'bg-gradient-to-r from-purple-500 to-purple-600',
      'sports_recreation': 'bg-gradient-to-r from-green-500 to-green-600', 
      'municipal_government': 'bg-gradient-to-r from-blue-500 to-blue-600',
      'commercial': 'bg-gradient-to-r from-slate-600 to-slate-700',
      'construction': 'bg-gradient-to-r from-orange-500 to-orange-600',
      'emergency_disaster_relief': 'bg-gradient-to-r from-red-500 to-red-600',
      'private_events_weddings': 'bg-gradient-to-r from-pink-500 to-pink-600',
      'bars_restaurants': 'bg-gradient-to-r from-indigo-500 to-indigo-600',
      'retail': 'bg-gradient-to-r from-yellow-500 to-yellow-600',
      'other': 'bg-gradient-to-r from-gray-500 to-gray-600'
    } as const;
    return typeGradients[type as keyof typeof typeGradients] || 'bg-gradient-to-r from-gray-500 to-gray-600';
  };

  const formatTypeName = (type: string) => {
    return type.replace(/[_-]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h2 className="text-lg font-semibold text-gray-900 font-inter mb-4">Customer Types</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {customerTypes.map((type) => (
          <div key={type.customer_type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <Badge className={`${getTypeGradient(type.customer_type)} text-white border-0 font-bold px-3 py-1 rounded-full text-xs`}>
              {formatTypeName(type.customer_type)}
            </Badge>
            <span className="text-sm font-semibold text-gray-700 ml-2">
              ({type.total_count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};