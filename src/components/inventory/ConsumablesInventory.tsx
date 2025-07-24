import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ConsumablesDashboard } from './ConsumablesDashboard';
import { AddConsumableModal } from './AddConsumableModal';
import { EditConsumableModal } from './EditConsumableModal';
import { ReceiveStockModal } from './ReceiveStockModal';
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

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, QrCode, Bell, MapPin, Package, FileText, CheckSquare, ChevronDown } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { PageHeader } from '@/components/ui/PageHeader';

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
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [selectedConsumable, setSelectedConsumable] = useState<Consumable | null>(null);
  const isMobile = useIsMobile();

  const { data: consumables, isLoading, refetch } = useQuery({
    queryKey: ['consumables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('consumables' as any)
        .select('*')
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as Consumable[];
    }
  });

  const handleEdit = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowEditModal(true);
  };

  const handleReceiveStock = (consumable: Consumable) => {
    setSelectedConsumable(consumable);
    setShowReceiveModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowReceiveModal(false);
    setSelectedConsumable(null);
    refetch();
  };

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Consumables Management System"
        subtitle="Advanced consumables tracking, QR integration, and job usage monitoring"
      />
      
      <Tabs defaultValue="inventory" className="space-y-6">
        <div className="flex items-center gap-1">
          <TabsList className="flex-1">
            <TabsTrigger value="inventory">
              <Package className="w-4 h-4 mr-2" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="usage" className={isMobile ? "hidden" : ""}>
              <CheckSquare className="w-4 h-4 mr-2" />
              Usage
            </TabsTrigger>
            <TabsTrigger value="requests" className={isMobile ? "hidden" : ""}>
              <MapPin className="w-4 h-4 mr-2" />
              Requests
            </TabsTrigger>
            <TabsTrigger value="reports" className={isMobile ? "hidden" : ""}>
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="alerts" className="hidden">
              Alerts
            </TabsTrigger>
            <TabsTrigger value="qr-codes" className="hidden">
              QR Codes
            </TabsTrigger>
            <TabsTrigger value="mobile-pwa" className="hidden">
              Mobile PWA
            </TabsTrigger>
          </TabsList>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-3 py-1.5 text-sm font-medium">
                More
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {isMobile && (
                <>
                  <DropdownMenuItem onSelect={() => (document.querySelector('[value="usage"]') as HTMLElement)?.click()}>
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Usage
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => (document.querySelector('[value="requests"]') as HTMLElement)?.click()}>
                    <MapPin className="w-4 h-4 mr-2" />
                    Requests
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => (document.querySelector('[value="reports"]') as HTMLElement)?.click()}>
                    <FileText className="w-4 h-4 mr-2" />
                    Reports
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuItem onSelect={() => (document.querySelector('[value="alerts"]') as HTMLElement)?.click()}>
                <Bell className="w-4 h-4 mr-2" />
                Alerts
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => (document.querySelector('[value="qr-codes"]') as HTMLElement)?.click()}>
                <QrCode className="w-4 h-4 mr-2" />
                QR Codes
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => (document.querySelector('[value="mobile-pwa"]') as HTMLElement)?.click()}>
                <Package className="w-4 h-4 mr-2" />
                Mobile PWA
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Button onClick={() => setShowAddModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Consumable
              </Button>
            </div>
          </div>

          <ConsumablesDashboard 
            consumables={consumables || []}
            isLoading={isLoading}
            onEdit={handleEdit}
            onReceiveStock={handleReceiveStock}
            onRefetch={refetch}
          />
        </TabsContent>

        <TabsContent value="usage">
          <JobConsumablesTracker />
        </TabsContent>

        <TabsContent value="requests">
          <ConsumableRequestsManager />
        </TabsContent>

        <TabsContent value="reports">
          <ConsumablesReportsTab />
        </TabsContent>

        <TabsContent value="alerts">
          <ConsumableNotificationsPanel />
        </TabsContent>

        <TabsContent value="qr-codes">
          <ConsumableQRGenerator />
        </TabsContent>

        <TabsContent value="mobile-pwa">
          <ConsumablePWAManager />
        </TabsContent>
      </Tabs>

      <AddConsumableModal 
        isOpen={showAddModal}
        onClose={handleModalClose}
      />

      <EditConsumableModal 
        isOpen={showEditModal}
        consumable={selectedConsumable}
        onClose={handleModalClose}
      />

      <ReceiveStockModal 
        isOpen={showReceiveModal}
        consumable={selectedConsumable}
        onClose={handleModalClose}
      />
    </div>
  );
};