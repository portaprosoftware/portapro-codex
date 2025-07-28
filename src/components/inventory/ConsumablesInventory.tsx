import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsumablesDashboard } from './ConsumablesDashboard';
import { AddConsumableModal } from './AddConsumableModal';
import { EditConsumableModal } from './EditConsumableModal';

import { ConsumableQRGenerator } from './ConsumableQRGenerator';
import { ConsumableRequestsManager } from './ConsumableRequestsManager';
import { JobConsumablesTracker } from './JobConsumablesTracker';
import { ConsumableNotificationsPanel } from './ConsumableNotificationsPanel';
import { AdvancedConsumableAnalytics } from './AdvancedConsumableAnalytics';
import { ConsumablePWAManager } from './ConsumablePWAManager';
import { EnterpriseIntegrationsHub } from './EnterpriseIntegrationsHub';
import { RealTimeCollaborationSystem } from './RealTimeCollaborationSystem';
import { EnterpriseReportingSystem } from './EnterpriseReportingSystem';
import { ConsumablesReportsTab } from './ConsumablesReportsTab';
import { StockTransferReporting } from './StockTransferReporting';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, QrCode, Bell, MapPin, Package, FileText, CheckSquare, ChevronDown, MoreHorizontal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { TabNav } from '@/components/ui/TabNav';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface Consumable {
  id: string;
  name: string;
  description?: string;
  category: string;
  sku?: string;
  unit_cost: number;
  unit_price: number;
  on_hand_qty: number;
  reorder_threshold: number;
  is_active: boolean;
  supplier_info?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const ConsumablesInventory: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const [activeTab, setActiveTab] = useState('inventory');
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const { data: consumables, isLoading, refetch } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      console.log('Fetching consumables from database...');
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .order('name');
      
      if (error) {
        console.error('Error fetching consumables:', error);
        throw error;
      }
      
      console.log('Raw consumables data:', data);
      
      // Process the data to ensure proper type handling
      const processedData = (data || []).map((consumable: any) => {
        // Parse location_stock if it's a string
        let locationStock = consumable.location_stock;
        if (typeof locationStock === 'string') {
          try {
            locationStock = JSON.parse(locationStock);
          } catch (e) {
            console.warn('Failed to parse location_stock for consumable:', consumable.id);
            locationStock = [];
          }
        }
        
        return {
          ...consumable,
          location_stock: Array.isArray(locationStock) ? locationStock : []
        };
      });
      
      console.log('Processed consumables:', processedData);
      return processedData as unknown as Consumable[];
    },
    // Force refetch to get updated data
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true
  });

  const handleEdit = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowEditModal(true);
  };


  // Delete consumable mutation with cascading deletes
  const deleteConsumableMutation = useMutation({
    mutationFn: async (consumableId: string) => {
      console.log('Attempting to delete consumable:', consumableId);
      
      // First delete related consumable_location_stock records
      const { error: locationStockError } = await supabase
        .from('consumable_location_stock' as any)
        .delete()
        .eq('consumable_id', consumableId);
      
      if (locationStockError) {
        console.error('Error deleting location stock:', locationStockError);
        throw new Error(`Failed to delete location stock: ${locationStockError.message}`);
      }
      
      // Then delete related job_consumables records
      const { error: jobConsumablesError } = await supabase
        .from('job_consumables' as any)
        .delete()
        .eq('consumable_id', consumableId);
      
      if (jobConsumablesError) {
        console.error('Error deleting job consumables:', jobConsumablesError);
        throw new Error(`Failed to delete job consumables: ${jobConsumablesError.message}`);
      }
      
      // Finally delete the consumable itself
      const { error: consumableError } = await supabase
        .from('consumables' as any)
        .delete()
        .eq('id', consumableId);
      
      if (consumableError) {
        console.error('Error deleting consumable:', consumableError);
        throw new Error(`Failed to delete consumable: ${consumableError.message}`);
      }
      
      console.log('Consumable deleted successfully');
    },
    onSuccess: () => {
      toast.success('Consumable deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['consumables'] });
      queryClient.invalidateQueries({ queryKey: ['consumable-location-stock'] });
    },
    onError: (error: any) => {
      console.error('Error deleting consumable:', error);
      toast.error(`Failed to delete consumable: ${error.message || 'Unknown error'}`);
    }
  });

  const handleDelete = (consumable: Consumable) => {
    console.log('Delete requested for consumable:', consumable);
    if (window.confirm(`Are you sure you want to delete "${consumable.name}"? This will also delete all related stock locations and job usage records. This action cannot be undone.`)) {
      deleteConsumableMutation.mutate(consumable.id);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedConsumable(null);
    // Refetch data when modal closes to show updated information
    setTimeout(() => {
      refetch();
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-none px-6 py-6 space-y-6">
        {/* Page Header with Navigation Pills */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 font-inter">Consumables Management System</h1>
              <p className="text-base text-gray-600 font-inter mt-1">Advanced consumables tracking, QR integration, and job usage monitoring</p>
            </div>
            
            {/* Consumables Sub-Navigation Pills */}
            <div className="flex items-center justify-between">
              <div className="enterprise-tabs">
                <TabNav ariaLabel="Consumables views">
                  <TabNav.Item 
                    to="#"
                    isActive={activeTab === 'inventory'}
                    onClick={() => setActiveTab('inventory')}
                  >
                    <Package className="w-4 h-4" />
                    Inventory
                  </TabNav.Item>
                  <TabNav.Item 
                    to="#"
                    isActive={activeTab === 'usage'}
                    onClick={() => setActiveTab('usage')}
                  >
                    <CheckSquare className="w-4 h-4" />
                    Usage
                  </TabNav.Item>
                  <TabNav.Item 
                    to="#"
                    isActive={activeTab === 'requests'}
                    onClick={() => setActiveTab('requests')}
                  >
                    <MapPin className="w-4 h-4" />
                    Requests
                  </TabNav.Item>
                  <TabNav.Item 
                    to="#"
                    isActive={activeTab === 'reports'}
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileText className="w-4 h-4" />
                    Reports
                  </TabNav.Item>
                </TabNav>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Consumable
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-3 py-1.5 text-sm font-medium">
                      More
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setActiveTab('alerts')}>
                      <Bell className="w-4 h-4 mr-2" />
                      Alerts
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab('qr-codes')}>
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Codes
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setActiveTab('mobile-pwa')}>
                      <Package className="w-4 h-4 mr-2" />
                      Mobile PWA
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'inventory' && (
            <ConsumablesDashboard 
              consumables={consumables || []}
              isLoading={isLoading}
              onEdit={handleEdit}
              
              onDelete={handleDelete}
              onRefetch={refetch}
            />
          )}

          {activeTab === 'usage' && <JobConsumablesTracker />}
          {activeTab === 'requests' && <ConsumableRequestsManager />}
          {activeTab === 'reports' && <ConsumablesReportsTab />}
          {activeTab === 'transfers' && <StockTransferReporting />}
          {activeTab === 'alerts' && <ConsumableNotificationsPanel />}
          {activeTab === 'qr-codes' && <ConsumableQRGenerator />}
          {activeTab === 'mobile-pwa' && <ConsumablePWAManager />}
        </div>

        <AddConsumableModal 
          isOpen={showAddModal}
          onClose={handleModalClose}
        />

        <EditConsumableModal 
          isOpen={showEditModal}
          consumable={selectedConsumable}
          onClose={handleModalClose}
        />

      </div>
    </div>
  );
};